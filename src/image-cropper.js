var time;//背景变暗延时函数
Component({
  properties: {
    /**
     * 图片路径
     */
    'imgSrc': {
      type: String
    },
    /**
     * 裁剪框高度
     */
    'height': {
      type: Number,
      value: 200
    },
    /**
     * 裁剪框宽度
     */
    'width': {
      type: Number,
      value: 200
    },
    /**
     * 生成的图片尺寸相对剪裁框的比例
     */
    'export_scale': {
      type: Number,
      value: 3
    },
    /**
     * 生成的图片质量0-1
     */
    'quality': {
      type: Number,
      value: 1
    },
    'cut_top': {
      type: Number,
      value: null
    },
    'cut_left': {
      type: Number,
      value: null
    },
    /**
     * canvas上边距（不设置默认不显示）
     */
    'canvas_top': {
      type: Number,
      value: null
    },
    /**
     * canvas左边距（不设置默认不显示）
     */
    'canvas_left': {
      type: Number,
      value: null
    },
    /**
     * 图片宽度
     */
    'imgWidth': {
      type: null,
      value: null
    },
    /**
     * 图片高度
     */
    'imgHeight': {
      type: null,
      value: null
    },
    /**
     * 图片缩放比
     */
    'scale': {
      type: Number,
      value: 1
    },
    /**
     * 图片旋转角度
     */
    'angle': {
      type: Number,
      value: 0
    },
    /**
     * 最小缩放比
     */
    'min_scale': {
      type: Number,
      value: 0.5
    },
    /**
     * 最大缩放比
     */
    'max_scale': {
      type: Number,
      value: 2
    },
    /**
     * 是否禁用旋转
     */
    'disable_rotate': {
      type: Boolean,
      value: false
    },
    /**
     * 是否限制移动范围(剪裁框只能在图片内)
     */
    'limit_move':{
      type: Boolean,
      value: false
    }
  },
  data: {
    el: 'image-cropper', //暂时无用
    info: wx.getSystemInfoSync(),
    init_imgWidth: 0, //图片设置尺寸,此值不变（记录最初设定的尺寸）
    init_imgHeight: 0, //图片设置尺寸,此值不变（记录最初设定的尺寸）
    origin_x: 0.5, //图片旋转中心
    origin_y: 0.5, //图片旋转中心
    imgTop: wx.getSystemInfoSync().windowHeight / 2, //图片上边距
    imgLeft: wx.getSystemInfoSync().windowWidth / 2, //图片左边距
    touch_img_relative: [{
      x: 0,
      y: 0
    }], //鼠标和图片中心的相对位置
    first_Hypotenuse: 0, //双指触摸时斜边长度
    flag: false, //是否结束触摸
    flag_bright: true, //背景是否亮
    canvas_overflow:true,//canvas缩略图是否在屏幕外面
    watch: {
      //监听截取框宽高变化
      width(value, that) {
        that._computeCutSize();
        that._imgMarginDetectionScale()
      },
      height(value, that) {
        that._computeCutSize();
        that._imgMarginDetectionScale();
      },
      limit_move(value, that){
        if (value) {
          that.setData({angle:0});
          that._imgMarginDetectionScale();
          that._draw();
        }
      },
      canvas_top(value, that){
        that._canvasDetectionPosition();
      },
      canvas_left(value, that){
        that._canvasDetectionPosition();
      },
      imgSrc(value, that){
        that.pushImg();
      },
      cut_top(value, that) {
        that._cutDetectionPosition();
        if (that.data.limit_move) {
          that._imgMarginDetectionScale();
          that._draw();
        }
      },
      cut_left(value, that) {
        that._cutDetectionPosition();
        if (that.data.limit_move) {
          that._imgMarginDetectionScale();
          that._draw();
        }
      }
    }
  },
  attached() {
    //启用数据监听
    this._watcher();
    this.data.init_imgWidth = this.data.imgWidth;
    this.data.init_imgHeight = this.data.imgHeight;
    this.data.imgSrc ? this.data.imgSrc = this.data.imgSrc:'';
    //根据开发者设置的图片目标尺寸计算实际尺寸
    this._initImageSize();
    //设置裁剪框大小>设置图片尺寸>绘制canvas
    this._computeCutSize();
    //检查裁剪框是否在范围内
    this._cutDetectionPosition();
    //检查canvas是否在范围内
    this._canvasDetectionPosition();
    //初始化完成
    this._onload && this._onload(this);
  },
  methods: {
    /**
     * 初始化完成回调
     */
    onload(callback) {
      this._onload = callback;
    },
    /**
     * 图片加载完成回调
     */
    onloadImage(callback) {
      this._onloadImage = callback;
    },
    /**
     * 点击中间剪裁框的回调
     */
    onClickCut(callback) {
      this._onClickCut = callback;
    },
    /**
     * 上传图片
     */
    upload() {
      let that = this;
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success(res) {
          const tempFilePaths = res.tempFilePaths[0];
          that.pushImg(tempFilePaths);
        }
      })
    },
    /**
     * 返回图片路径
     */
    getImg(getCallback) {
      this._draw();
      wx.canvasToTempFilePath({
        width: this.data.width,
        height: this.data.height,
        destWidth: this.data.width * this.data.export_scale,
        destHeight: this.data.height * this.data.export_scale,
        fileType: 'png',
        quality: this.data.quality,
        canvasId: this.data.el,
        success(res) {
          getCallback(res.tempFilePath);
        }
      }, this);
    },
    /**
     * 设置图片动画
     * {
     *    x:10,//图片在原有基础上向下移动10px
     *    y:10,//图片在原有基础上向右移动10px
     *    angle:10,//图片在原有基础上旋转10deg
     *    scale:0.5,//图片在原有基础上增加0.5倍
     * }
     */
    setTransform(transform) {
      if (!transform) return;
      if (!this.data.disable_rotate){
        this.setData({
          angle: transform.angle ? this.data.angle + transform.angle : this.data.angle
        });
      }
      var scale = this.data.scale;
      if (transform.scale) {
        scale = this.data.scale + transform.scale;
        scale = scale <= this.data.min_scale ? this.data.min_scale : scale;
        scale = scale >= this.data.max_scale ? this.data.max_scale : scale;
      }
      this.data.scale = scale;
      let cutX = this.data.cut_left;
      let cutY = this.data.cut_top;
      if (transform.cutX){
        this.setData({
          cut_left: cutX + transform.cutX
        });
        this.data.watch.cut_left(null, this);
      }
      if (transform.cutY){
        this.setData({
          cut_top: cutY + transform.cutY
        });
        this.data.watch.cut_top(null, this);
      }
      this.data.imgTop = transform.y ? this.data.imgTop + transform.y : this.data.imgTop;
      this.data.imgLeft = transform.x ? this.data.imgLeft + transform.x : this.data.imgLeft;
      //图像边缘检测,防止截取到空白
      this._imgMarginDetectionScale();
      this.setData({
        scale: this.data.scale,
        imgTop: this.data.imgTop,
        imgLeft: this.data.imgLeft,
      });
      if (!this.data.canvas_overflow){
        this._draw();
      }
    },
    /**
     * 设置剪裁框位置
     */
    setCutXY(x,y){
      this.setData({
        cut_top: y,
        cut_left:x
      });
    },
    /**
     * 设置剪裁框尺寸
     */
    setCutSize(w,h){
      this.setData({
        width: w,
        height:h
      });
      this._computeCutSize();
    },
    /**
     * 设置剪裁框居中
     */
    setCutCenter() {
      let cut_top = (this.data.info.windowHeight - this.data.height) * 0.5;
      let cut_left = (this.data.info.windowWidth - this.data.width) * 0.5;
      this.setData({
        cut_top: cut_top, //截取的框上边距
        cut_left: cut_left, //截取的框左边距
      });
    },
    /**
     * 设置剪裁框宽度-即将废弃
     */
    setWidth(width) {
      this.setData({
        width: width
      });
      this._computeCutSize();
    },
    /**
     * 设置剪裁框高度-即将废弃
     */
    setHeight(height) {
      this.setData({
        height: height
      });
      this._computeCutSize();
    },
    /**
     * 是否锁定旋转
     */
    setDisableRotate(value){
      this.data.disable_rotate = value;
    },
    /**
     * 初始化图片，包括位置、大小、旋转角度
     */
    imgReset() {
      this.setData({
        scale: 1,
        angle: 0,
        imgTop: wx.getSystemInfoSync().windowHeight / 2,
        imgLeft: wx.getSystemInfoSync().windowWidth / 2,
      })
    },
    /**
     * 加载（更换）图片
     */
    pushImg(src) {
      if (src) {
        this.setData({
          imgSrc: src
        });
        //发现是手动赋值直接返回，交给watch处理
        return;
      }
      wx.getImageInfo({
        src: this.data.imgSrc,
        success: (res) => {
          this.data.imageObject = res;
          //图片非本地路径需要换成本地路径
          if (this.data.imgSrc.search(/tmp/) == -1){
            this.setData({
              imgSrc: res.path
            });
          }
          //计算最后图片尺寸
          this._imgComputeSize();
          if (this.data.limit_move) {
            //限制移动，不留空白处理
            this._imgMarginDetectionScale();
            this.setData({
              scale: this.data.scale
            });
          }
          this._draw();
          this._onloadImage && this._onloadImage(res);//图片加载完成回调
        },
        fail: (err) => {
          this.setData({
            imgSrc: ''
          });
        }
      });
    },
    /**
     * 设置图片放大缩小
     */
    setScale(scale) {
      if (!scale) return;
      this.setData({
        scale: scale.toFixed(3)
      });
      if (!this.data.canvas_overflow) {
        this._draw();
      }
    },
    /**
     * 设置图片旋转角度
     */
    setAngle(angle) {
      if (!angle) return;
      this.setData({
        angle: angle.toFixed(2)
      });
      if (!this.data.canvas_overflow) {
        this._draw();
      }
    },
    _initCanvas() {
      //初始化canvas
      if (!this.data.ctx){
        this.data.ctx = wx.createCanvasContext(this.data.el, this);
      }
      this.data.ctx.width = this.data.width;
      this.data.ctx.height = this.data.height;
      if (this.data.imgSrc) {
        //渲染canvas
        this._draw();
      }
    },
    /**
     * 根据开发者设置的图片目标尺寸计算实际尺寸
     */
    _initImageSize(){
      //处理宽高特殊单位 %>px
      if (this.data.init_imgWidth && this.data.init_imgWidth.indexOf("%") != -1) {
        let width = this.data.init_imgWidth.replace("%", "");
        this.data.init_imgWidth = this.data.imgWidth = this.data.info.windowWidth / 100 * width;
      }
      if (this.data.init_imgHeight && this.data.init_imgHeight.indexOf("%") != -1) {
        let height = this.data.imgHeight.replace("%", "");
        this.data.init_imgHeight = this.data.imgHeight = this.data.info.windowHeight / 100 * height;
      }
    },
    /**
     * 检测剪裁框位置是否在允许的范围内(屏幕内)
     */
    _cutDetectionPosition(){
      let _cutDetectionPositionTop = () => {
        //检测上边距是否在范围内
        if (this.data.cut_top < 0) {
          this.setData({
            cut_top: 0
          });
        }
        if (this.data.cut_top > this.data.info.windowHeight - this.data.height) {
          this.setData({
            cut_top: this.data.info.windowHeight - this.data.height
          });
        }
      }, _cutDetectionPositionLeft = () => {
        //检测左边距是否在范围内
        if (this.data.cut_left < 0) {
          this.setData({
            cut_left: 0
          });
        }
        if (this.data.cut_left > this.data.info.windowWidth - this.data.width) {
          this.setData({
            cut_left: this.data.info.windowWidth - this.data.width
          });
        }
      };
      //裁剪框坐标处理（如果只写一个参数则另一个默认为0，都不写默认居中）
      if (this.data.cut_top == null && this.data.cut_left == null) {
        this.setCutCenter();
      } else if (this.data.cut_top != null && this.data.cut_left != null){
        _cutDetectionPositionTop();
        _cutDetectionPositionLeft();
      } else if (this.data.cut_top != null && this.data.cut_left == null) {
        _cutDetectionPositionTop();
        this.setData({
          cut_left: (wx.getSystemInfoSync().windowWidth - this.data.width) / 2
        });
      } else if (this.data.cut_top == null && this.data.cut_left != null) {
        _cutDetectionPositionLeft();
        this.setData({
          cut_top: (wx.getSystemInfoSync().windowHeight - this.data.height) / 2
        });
      }
    },
    /**
     * 检测canvas位置是否在允许的范围内(屏幕内)如果在屏幕外则不开启实时渲染
     * 如果只写一个参数则另一个默认为0，都不写默认超出屏幕外
     */
    _canvasDetectionPosition(){
      if(this.data.canvas_top == null && this.data.canvas_left == null) {
        this.data.canvas_overflow = false;
        this.setData({
          canvas_top: -5000,
          canvas_left: -5000
        });
      }else if(this.data.canvas_top != null && this.data.canvas_left != null) {
        if (this.data.canvas_top < - this.data.height || this.data.canvas_top > this.data.info.windowHeight) {
          this.data.canvas_overflow = true;
        } else {
          this.data.canvas_overflow = false;
        }
      }else if(this.data.canvas_top != null && this.data.canvas_left == null) {
        this.setData({
          canvas_left: 0
        });
      } else if (this.data.canvas_top == null && this.data.canvas_left != null) {
        this.setData({
          canvas_top: 0
        });
        if (this.data.canvas_left < -this.data.width || this.data.canvas_left > this.data.info.windowWidth) {
          this.data.canvas_overflow = true;
        } else {
          this.data.canvas_overflow = false;
        }
      }
    },
    /**
     * 图片边缘检测-位置
     */
    _imgMarginDetectionPosition() {
      if (!this.data.limit_move)return;
      let left = this.data.imgLeft;
      let top = this.data.imgTop;
      left = this.data.cut_left + this.data.imgWidth * this.data.scale / 2 >= left ? left : this.data.cut_left + this.data.imgWidth * this.data.scale / 2;
      left = this.data.cut_left + this.data.width - this.data.imgWidth * this.data.scale / 2 <= left ? left : this.data.cut_left + this.data.width - this.data.imgWidth * this.data.scale / 2;
      top = this.data.cut_top + this.data.imgHeight * this.data.scale / 2 >= top ? top : this.data.cut_top + this.data.imgHeight * this.data.scale / 2;
      top = this.data.cut_top + this.data.height - this.data.imgHeight * this.data.scale / 2 <= top ? top : this.data.cut_top + this.data.height - this.data.imgHeight * this.data.scale / 2;
      this.data.imgLeft = left;
      this.data.imgTop = top;
      this.setData({
        imgLeft: this.data.imgLeft,
        imgTop: this.data.imgTop,
      });
    },
    /**
     * 图片边缘检测-缩放
     */
    _imgMarginDetectionScale(){
      if (!this.data.limit_move) return;
      let scale = this.data.scale;
      let min_scale;
      //求最小scale
      if (this.data.imgHeight * scale < this.data.imgWidth * scale){
        min_scale = this.data.height / this.data.imgHeight;
      }else{
        min_scale = this.data.width / this.data.imgWidth;
      }
      if (this.data.imgWidth * scale < this.data.width || this.data.imgHeight * scale < this.data.height){
        this.data.scale = min_scale;
      }
      //改变位置
      this._imgMarginDetectionPosition();
      this.setData({
        scale: this.data.scale
      });
    },
    /**
     * 计算图片尺寸
     */
    _imgComputeSize() {
      let imgWidth = this.data.imgWidth,
          imgHeight = this.data.imgHeight;
      if (!this.data.init_imgHeight && !this.data.init_imgWidth) {
        //默认按图片最小边 = 对应裁剪框尺寸
        imgWidth = this.data.imageObject.width;
        imgHeight = this.data.imageObject.height;
        if (imgWidth / imgHeight > this.data.width / this.data.height){
          imgHeight = this.data.height;
          imgWidth = this.data.imageObject.width / this.data.imageObject.height * imgHeight;
        }else{
          imgWidth = this.data.width;
          imgHeight = this.data.imageObject.height / this.data.imageObject.width * imgWidth;
        }
      } else if (this.data.init_imgHeight && !this.data.init_imgWidth) {
        imgWidth = this.data.imageObject.width / this.data.imageObject.height * this.data.init_imgHeight;
      } else if (!this.data.init_imgHeight && this.data.init_imgWidth) {
        imgHeight = this.data.imageObject.height / this.data.imageObject.width * this.data.init_imgWidth;
      }
      this.setData({
        imgWidth: imgWidth,
        imgHeight: imgHeight
      });
    },
    //改变截取框大小
    _computeCutSize() {
      if (this.data.width > this.data.info.windowWidth) {
        this.setData({
          width: this.data.info.windowWidth,
        });
      } else if (this.data.width + this.data.cut_left > this.data.info.windowWidth){
        this.setData({
          cut_left: this.data.info.windowWidth - this.data.cut_left,
        });
      };
      if (this.data.height > this.data.info.windowHeight) {
        this.setData({
          height: this.data.info.windowHeight,
        });
      } else if (this.data.height + this.data.cut_top > this.data.info.windowHeight){
        this.setData({
          cut_top: this.data.info.windowHeight - this.data.cut_top,
        });
      }
      //修改canvas尺寸,不需要重新添加图片
      this._initCanvas();
    },
    //开始触摸
    _start(event) {
      this.data.flag = false;
      if (event.touches.length == 1) {
        //单指拖动
        this.data.touch_img_relative[0] = {
          x: event.touches[0].clientX - this.data.imgLeft,
          y: event.touches[0].clientY - this.data.imgTop
        }
      } else {
        //双指放大
        let width = Math.abs(event.touches[0].clientX - event.touches[1].clientX);
        let height = Math.abs(event.touches[0].clientY - event.touches[1].clientY);
        this.data.touch_img_relative = [{
          x: event.touches[0].clientX - this.data.imgLeft,
          y: event.touches[0].clientY - this.data.imgTop
        }, {
            x: event.touches[1].clientX - this.data.imgLeft,
            y: event.touches[1].clientY - this.data.imgTop
        }];
        this.data.first_Hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
      }
      if (!this.data.canvas_overflow) {
        this._draw(); //实时渲染canvas
      }
    },
    _move(event) {
      if (this.data.flag) return;
      if (!this.data.flag_bright) {
        clearTimeout(time);
        this.data.flag_bright = true;
        this.setData({
          flag_bright: true
        });
      }
      if (event.touches.length == 1) {
        //单指拖动
        let left = event.touches[0].clientX - this.data.touch_img_relative[0].x,
            top = event.touches[0].clientY - this.data.touch_img_relative[0].y;
        //图像边缘检测,防止截取到空白
        this.data.imgLeft = left;
        this.data.imgTop = top;
        this._imgMarginDetectionPosition();
        this.setData({
          imgLeft: this.data.imgLeft,
          imgTop: this.data.imgTop
        });
      } else {
        //双指放大
        let width = Math.abs(event.touches[0].clientX - event.touches[1].clientX),
            height = Math.abs(event.touches[0].clientY - event.touches[1].clientY),
            hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)),
            scale = this.data.scale * (hypotenuse / this.data.first_Hypotenuse),
            current_deg = 0;
        scale = scale <= this.data.min_scale ? this.data.min_scale : scale;
        scale = scale >= this.data.max_scale ? this.data.max_scale : scale;
        //图像边缘检测,防止截取到空白
        this.data.scale = scale;
        this._imgMarginDetectionScale();
        //双指旋转(如果没禁用旋转)
        let touch_img_relative = [{
          x: event.touches[0].clientX - this.data.imgLeft,
          y: event.touches[0].clientY - this.data.imgTop
        }, {
            x: event.touches[1].clientX - this.data.imgLeft,
            y: event.touches[1].clientY - this.data.imgTop 
        }];
        if (!this.data.disable_rotate){
          let first_atan = 180 / Math.PI * Math.atan2(touch_img_relative[0].y, touch_img_relative[0].x);
          let first_atan_old = 180 / Math.PI * Math.atan2(this.data.touch_img_relative[0].y, this.data.touch_img_relative[0].x);
          let second_atan = 180 / Math.PI * Math.atan2(touch_img_relative[1].y, touch_img_relative[1].x);
          let second_atan_old = 180 / Math.PI * Math.atan2(this.data.touch_img_relative[1].y, this.data.touch_img_relative[1].x);
          //当前旋转的角度
          let first_deg = first_atan - first_atan_old,
              second_deg = second_atan - second_atan_old;
          if (first_deg != 0) {
            current_deg = first_deg;
          } else if (second_deg != 0) {
            current_deg = second_deg;
          }
        }
        this.data.touch_img_relative = touch_img_relative;
        this.data.first_Hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        //更新视图
        this.setData({
          angle: this.data.angle + current_deg,
          scale: this.data.scale
        });
      }
      if (!this.data.canvas_overflow) {
        this._draw();
      }
    },
    //结束操作
    _end(event) {
      this.data.flag = true;
      clearTimeout(time);
      time = setTimeout(() => {
        this.setData({
          flag_bright: false
        });
      }, 2000)
    },
    //点击中间剪裁框处理
    _click(event) {
      if (!this.data.imgSrc) {
        //调起上传
        this.upload();
        return;
      }
      this._draw();
      let x = event.detail.x;
      let y = event.detail.y;
      if ((x >= this.data.cut_left && x <= (this.data.cut_left + this.data.width)) && (y >= this.data.cut_top && y <= (this.data.cut_top + this.data.height))) {
        //生成图片并回调
        wx.canvasToTempFilePath({
          width: this.data.width,
          height: this.data.height,
          destWidth: this.data.width * this.data.export_scale,
          destHeight: this.data.height * this.data.export_scale,
          fileType: 'png',
          quality: this.data.quality,
          canvasId: this.data.el,
          success: (res) => {
            this._onClickCut && this._onClickCut(res.tempFilePath);
          }
        }, this)
      }
    },
    //渲染
    _draw() {
      if (!this.data.imgSrc) return;
      //图片实际大小
      let imgWidth = this.data.imgWidth * this.data.scale;
      let imgHeight = this.data.imgHeight * this.data.scale;
      //canvas和图片的相对距离
      var xpos = this.data.imgLeft - this.data.cut_left;
      var ypos = this.data.imgTop - this.data.cut_top;
      //旋转画布
      this.data.ctx.translate(xpos, ypos);
      this.data.ctx.rotate(this.data.angle * Math.PI / 180);
      this.data.ctx.drawImage(this.data.imgSrc, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
      this.data.ctx.draw();
    },
    //监听器
    _watcher() {
      Object.keys(this.data.watch).forEach(v => {
        this._observe(this.data, v, this.data.watch[v]);
      })
    },
    _observe(obj, key, watchFun) {
      var val = obj[key]; // 给该属性设默认值
      Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: true,
        set:(value) => {
          val = value;
          watchFun(val, this);
        },
        get() {
          return val;
        }
      })
    }
  },
  _preventTouchMove() {

  },
  ready(options) {

  }
})
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
     * 裁剪框最小尺寸
     */
    'min_width': {
      type: Number,
      value: 100
    },
    'min_height': {
      type: Number,
      value: 100
    },
    /**
     * 裁剪框最大尺寸
     */
    'max_width': {
      type: Number,
      value: 300
    },
    'max_height': {
      type: Number,
      value: 300
    },
    /**
     * 裁剪框禁止拖动
     */
    'disable_width': {
      type: Boolean,
      value: false
    },
    'disable_height': {
      type: Boolean,
      value: false
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
    'img_width': {
      type: null,
      value: null
    },
    /**
     * 图片高度
     */
    'img_height': {
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
    INIT_IMGWIDTH: 0, //图片设置尺寸,此值不变（记录最初设定的尺寸）
    INIT_IMGHEIGHT: 0, //图片设置尺寸,此值不变（记录最初设定的尺寸）
    TIME_BG: null,//背景变暗延时函数
    TIME_CUT_CENTER:null,
    _touch_img_relative: [{
      x: 0,
      y: 0
    }], //鼠标和图片中心的相对位置
    _flag_cut_touch:false,//是否是拖动裁剪框
    _hypotenuse_length: 0, //双指触摸时斜边长度
    _flag_img_endtouch: false, //是否结束触摸
    _flag_bright: true, //背景是否亮
    _canvas_overflow:true,//canvas缩略图是否在屏幕外面
    _canvas_width:200,
    _canvas_height:200,
    origin_x: 0.5, //图片旋转中心
    origin_y: 0.5, //图片旋转中心
    _img_top: wx.getSystemInfoSync().windowHeight / 2, //图片上边距
    _img_left: wx.getSystemInfoSync().windowWidth / 2, //图片左边距
    watch: {
      //监听截取框宽高变化
      width(value, that) {
        if (value < that.data.min_width){
          that.setData({
            width: that.data.min_width
          });
        }
        that._computeCutSize();
        that._imgMarginDetectionScale()
      },
      height(value, that) {
        if (value < that.data.min_height) {
          that.setData({
            height: that.data.min_height
          });
        }
        that._computeCutSize();
        that._imgMarginDetectionScale();
      },
      limit_move(value, that){
        if (value) {
          that.setData({angle:0});
          that._imgMarginDetectionScale();
          !that.data._canvas_overflow && that._draw();
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
          !that.data._canvas_overflow && that._draw();
        }
      },
      cut_left(value, that) {
        that._cutDetectionPosition();
        if (that.data.limit_move) {
          that._imgMarginDetectionScale();
          !that.data._canvas_overflow && that._draw();
        }
      }
    }
  },
  attached() {
    //启用数据监听
    this._watcher();
    this.data.INIT_IMGWIDTH = this.data.img_width;
    this.data.INIT_IMGHEIGHT = this.data.img_height;
    this.setData({
      _canvas_height: this.data.height,
      _canvas_width: this.data.width,
    });
    this._initCanvas();
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
    this.triggerEvent('load', {
      cropper: this
    });
  },
  methods: {
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
      this._draw(()=>{
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
      });
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
      this.data._img_top = transform.y ? this.data._img_top + transform.y : this.data._img_top;
      this.data._img_left = transform.x ? this.data._img_left + transform.x : this.data._img_left;
      //图像边缘检测,防止截取到空白
      this._imgMarginDetectionScale();
      this._moveDuring();
      this.setData({
        scale: this.data.scale,
        _img_top: this.data._img_top,
        _img_left: this.data._img_left,
      });
      !this.data._canvas_overflow && this._draw();
      this._moveStop();//结束操作
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
        _img_top: this.data._img_top - this.data.cut_top + (this.data.info.windowHeight - this.data.height) * 0.5,
        cut_top: cut_top, //截取的框上边距
        _img_left: this.data._img_left - this.data.cut_left + (this.data.info.windowWidth - this.data.width) * 0.5,
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
        _img_top: wx.getSystemInfoSync().windowHeight / 2,
        _img_left: wx.getSystemInfoSync().windowWidth / 2,
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
        },
        fail: (err) => {
          this.setData({
            imgSrc: ''
          });
        }
      });
    },
    imageLoad(e){
      setTimeout(()=>{
      this.triggerEvent('imageload', this.data.imageObject);

      },1000)
    },
    /**
     * 设置图片放大缩小
     */
    setScale(scale) {
      if (!scale) return;
      this.setData({
        scale: scale.toFixed(3)
      });
      !this.data._canvas_overflow && this._draw();
    },
    /**
     * 设置图片旋转角度
     */
    setAngle(angle) {
      if (!angle) return;
      this.setData({
        angle: angle.toFixed(2)
      });
      !this.data._canvas_overflow && this._draw();
    },
    _initCanvas() {
      //初始化canvas
      if (!this.data.ctx){
        this.data.ctx = wx.createCanvasContext("image-cropper", this);
      }
    },
    /**
     * 根据开发者设置的图片目标尺寸计算实际尺寸
     */
    _initImageSize(){
      //处理宽高特殊单位 %>px
      if (this.data.INIT_IMGWIDTH && this.data.INIT_IMGWIDTH.indexOf("%") != -1) {
        let width = this.data.INIT_IMGWIDTH.replace("%", "");
        this.data.INIT_IMGWIDTH = this.data.img_width = this.data.info.windowWidth / 100 * width;
      }
      if (this.data.INIT_IMGHEIGHT && this.data.INIT_IMGHEIGHT.indexOf("%") != -1) {
        let height = this.data.img_height.replace("%", "");
        this.data.INIT_IMGHEIGHT = this.data.img_height = this.data.info.windowHeight / 100 * height;
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
        this.data._canvas_overflow = false;
        this.setData({
          canvas_top: -5000,
          canvas_left: -5000
        });
      }else if(this.data.canvas_top != null && this.data.canvas_left != null) {
        if (this.data.canvas_top < - this.data.height || this.data.canvas_top > this.data.info.windowHeight) {
          this.data._canvas_overflow = true;
        } else {
          this.data._canvas_overflow = false;
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
          this.data._canvas_overflow = true;
        } else {
          this.data._canvas_overflow = false;
        }
      }
    },
    /**
     * 图片边缘检测-位置
     */
    _imgMarginDetectionPosition() {
      if (!this.data.limit_move)return;
      let left = this.data._img_left;
      let top = this.data._img_top;
      left = this.data.cut_left + this.data.img_width * this.data.scale / 2 >= left ? left : this.data.cut_left + this.data.img_width * this.data.scale / 2;
      left = this.data.cut_left + this.data.width - this.data.img_width * this.data.scale / 2 <= left ? left : this.data.cut_left + this.data.width - this.data.img_width * this.data.scale / 2;
      top = this.data.cut_top + this.data.img_height * this.data.scale / 2 >= top ? top : this.data.cut_top + this.data.img_height * this.data.scale / 2;
      top = this.data.cut_top + this.data.height - this.data.img_height * this.data.scale / 2 <= top ? top : this.data.cut_top + this.data.height - this.data.img_height * this.data.scale / 2;
      this.data._img_left = left;
      this.data._img_top = top;
      this.setData({
        _img_left: this.data._img_left,
        _img_top: this.data._img_top,
      });
    },
    /**
     * 图片边缘检测-缩放
     */
    _imgMarginDetectionScale(){
      if (!this.data.limit_move) return;
      let scale = this.data.scale;
      if (this.data.img_width * scale < this.data.width){
        this.data.scale = this.data.width / this.data.img_width;
      } else if (this.data.img_height * scale < this.data.height){
        this.data.scale = this.data.height / this.data.img_height;
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
      let img_width = this.data.img_width,
          img_height = this.data.img_height;
      if (!this.data.INIT_IMGHEIGHT && !this.data.INIT_IMGWIDTH) {
        //默认按图片最小边 = 对应裁剪框尺寸
        img_width = this.data.imageObject.width;
        img_height = this.data.imageObject.height;
        if (img_width / img_height > this.data.width / this.data.height){
          img_height = this.data.height;
          img_width = this.data.imageObject.width / this.data.imageObject.height * img_height;
        }else{
          img_width = this.data.width;
          img_height = this.data.imageObject.height / this.data.imageObject.width * img_width;
        }
      } else if (this.data.INIT_IMGHEIGHT && !this.data.INIT_IMGWIDTH) {
        img_width = this.data.imageObject.width / this.data.imageObject.height * this.data.INIT_IMGHEIGHT;
      } else if (!this.data.INIT_IMGHEIGHT && this.data.INIT_IMGWIDTH) {
        img_height = this.data.imageObject.height / this.data.imageObject.width * this.data.INIT_IMGWIDTH;
      }
      this.setData({
        img_width: img_width,
        img_height: img_height
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
      !this.data._canvas_overflow && this._draw();
    },
    //开始触摸
    _start(event) {
      this.data._flag_img_endtouch = false;
      if (event.touches.length == 1) {
        //单指拖动
        this.data._touch_img_relative[0] = {
          x: event.touches[0].clientX - this.data._img_left,
          y: event.touches[0].clientY - this.data._img_top
        }
      } else {
        //双指放大
        let width = Math.abs(event.touches[0].clientX - event.touches[1].clientX);
        let height = Math.abs(event.touches[0].clientY - event.touches[1].clientY);
        this.data._touch_img_relative = [{
          x: event.touches[0].clientX - this.data._img_left,
          y: event.touches[0].clientY - this.data._img_top
        }, {
            x: event.touches[1].clientX - this.data._img_left,
            y: event.touches[1].clientY - this.data._img_top
        }];
        this.data._hypotenuse_length = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
      }
      !this.data._canvas_overflow && this._draw();
    },
    _move(event) {
      if (this.data._flag_img_endtouch) return;
      this._moveDuring();
      if (event.touches.length == 1) {
        //单指拖动
        let left = event.touches[0].clientX - this.data._touch_img_relative[0].x,
            top = event.touches[0].clientY - this.data._touch_img_relative[0].y;
        //图像边缘检测,防止截取到空白
        this.data._img_left = left;
        this.data._img_top = top;
        this._imgMarginDetectionPosition();
        this.setData({
          _img_left: this.data._img_left,
          _img_top: this.data._img_top
        });
      } else {
        //双指放大
        let width = Math.abs(event.touches[0].clientX - event.touches[1].clientX),
            height = Math.abs(event.touches[0].clientY - event.touches[1].clientY),
            hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)),
            scale = this.data.scale * (hypotenuse / this.data._hypotenuse_length),
            current_deg = 0;
        scale = scale <= this.data.min_scale ? this.data.min_scale : scale;
        scale = scale >= this.data.max_scale ? this.data.max_scale : scale;
        //图像边缘检测,防止截取到空白
        this.data.scale = scale;
        this._imgMarginDetectionScale();
        //双指旋转(如果没禁用旋转)
        let _touch_img_relative = [{
          x: event.touches[0].clientX - this.data._img_left,
          y: event.touches[0].clientY - this.data._img_top
        }, {
            x: event.touches[1].clientX - this.data._img_left,
            y: event.touches[1].clientY - this.data._img_top 
        }];
        if (!this.data.disable_rotate){
          let first_atan = 180 / Math.PI * Math.atan2(_touch_img_relative[0].y, _touch_img_relative[0].x);
          let first_atan_old = 180 / Math.PI * Math.atan2(this.data._touch_img_relative[0].y, this.data._touch_img_relative[0].x);
          let second_atan = 180 / Math.PI * Math.atan2(_touch_img_relative[1].y, _touch_img_relative[1].x);
          let second_atan_old = 180 / Math.PI * Math.atan2(this.data._touch_img_relative[1].y, this.data._touch_img_relative[1].x);
          //当前旋转的角度
          let first_deg = first_atan - first_atan_old,
              second_deg = second_atan - second_atan_old;
          if (first_deg != 0) {
            current_deg = first_deg;
          } else if (second_deg != 0) {
            current_deg = second_deg;
          }
        }
        this.data._touch_img_relative = _touch_img_relative;
        this.data._hypotenuse_length = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        //更新视图
        this.setData({
          angle: this.data.angle + current_deg,
          scale: this.data.scale
        });
      }
      !this.data._canvas_overflow && this._draw();
    },
    //结束操作
    _end(event) {
      this.data._flag_img_endtouch = true;
      this._moveStop();
    },
    //点击中间剪裁框处理
    _click(event) {
      if (!this.data.imgSrc) {
        //调起上传
        this.upload();
        return;
      }
      this._draw(()=>{
        let x = event.detail ? event.detail.x : event.touches[0].clientX;
        let y = event.detail ? event.detail.y : event.touches[0].clientY;
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
              this.triggerEvent('tapcut', {
                url: res.tempFilePath,
                width: this.data.width * this.data.export_scale,
                height: this.data.height * this.data.export_scale
              });
            }
          }, this)
        }
      });
    },
    //渲染
    _draw(callback) {
      if (!this.data.imgSrc) return;
      if (this.data.ctx.width != this.data.width || this.data.ctx.height != this.data.height){
        //优化拖动裁剪框，所以必须把宽高设置放在离用户触发渲染最近的地方
        this.setData({
          _canvas_height: this.data.height,
          _canvas_width: this.data.width,
        });
      }
      setTimeout(()=>{
        //图片实际大小
        let img_width = this.data.img_width * this.data.scale;
        let img_height = this.data.img_height * this.data.scale;
        //canvas和图片的相对距离
        var xpos = this.data._img_left - this.data.cut_left;
        var ypos = this.data._img_top - this.data.cut_top;
        //旋转画布
        this.data.ctx.translate(xpos, ypos);
        this.data.ctx.rotate(this.data.angle * Math.PI / 180);
        this.data.ctx.drawImage(this.data.imgSrc, -img_width / 2, -img_height / 2, img_width, img_height);
        this.data.ctx.draw();
        callback&&callback();
      },50)
    },
    //裁剪框处理
    _cutTouchMove(e) {
      if (this.data._flag_cut_touch) {
        let width = this.data.width,
          height = this.data.height,
          cut_top = this.data.cut_top,
          cut_left = this.data.cut_left,
          _width, _height;
        switch (this.data.CUT_START.corner) {
          case 1:
            _width = this.data.CUT_START.width + this.data.CUT_START.x - e.touches[0].clientX;
            _height = this.data.CUT_START.height - this.data.CUT_START.y + e.touches[0].clientY;
            if (_height >= this.data.min_height && _height <= this.data.max_height) {
              height = _height;
            }
            if (_width >= this.data.min_width && _width <= this.data.max_width) {
              width = _width;
              cut_left = this.data.CUT_START.cut_left - (width - this.data.CUT_START.width);
            }
            break
          case 2:
            _width = this.data.CUT_START.width + this.data.CUT_START.x - e.touches[0].clientX;
            _height = this.data.CUT_START.height + this.data.CUT_START.y - e.touches[0].clientY;
            if (_height >= this.data.min_height && _height <= this.data.max_height) {
              height = _height;
              cut_top = this.data.CUT_START.cut_top - (height - this.data.CUT_START.height)
            }
            if (_width >= this.data.min_width && _width <= this.data.max_width) {
              width = _width;
              cut_left = this.data.CUT_START.cut_left - (width - this.data.CUT_START.width)
            }
            break
          case 3:
            _width = this.data.CUT_START.width - this.data.CUT_START.x + e.touches[0].clientX;
            _height = this.data.CUT_START.height + this.data.CUT_START.y - e.touches[0].clientY;
            if (_height >= this.data.min_height && _height <= this.data.max_height) {
              height = _height;
              cut_top = this.data.CUT_START.cut_top - (height - this.data.CUT_START.height);
            }
            if (_width >= this.data.min_width && _width <= this.data.max_width) {
              width = _width;
            }
            break
          case 4:
            width = this.data.CUT_START.width - this.data.CUT_START.x + e.touches[0].clientX;
            height = this.data.CUT_START.height - this.data.CUT_START.y + e.touches[0].clientY;
            break
        }
        if (!this.data.disable_width && width <= this.data.max_width && width >= this.data.min_width) {
          this.setData({
            width: width,
            cut_left: cut_left,
          })
        }
        if (!this.data.disable_height && height <= this.data.max_height && height >= this.data.min_height) {
          this.setData({
            height: height,
            cut_top: cut_top,
          })
        }
      }
    },
    _cutTouchStart(e) {
      let currentX = e.touches[0].clientX;
      let currentY = e.touches[0].clientY;
      let cutbox_top4 = this.data.cut_top + this.data.height - 20;
      let cutbox_bottom4 = this.data.cut_top + this.data.height + 20;
      let cutbox_left4 = this.data.cut_left + this.data.width - 20;
      let cutbox_right4 = this.data.cut_left + this.data.width + 30;

      let cutbox_top3 = this.data.cut_top - 20;
      let cutbox_bottom3 = this.data.cut_top + 20;
      let cutbox_left3 = this.data.cut_left + this.data.width - 20;
      let cutbox_right3 = this.data.cut_left + this.data.width + 30;

      let cutbox_top2 = this.data.cut_top - 20;
      let cutbox_bottom2 = this.data.cut_top + 20;
      let cutbox_left2 = this.data.cut_left - 20;
      let cutbox_right2 = this.data.cut_left + 30;

      let cutbox_top1 = this.data.cut_top + this.data.height - 20;
      let cutbox_bottom1 = this.data.cut_top + this.data.height + 20;
      let cutbox_left1 = this.data.cut_left - 20;
      let cutbox_right1 = this.data.cut_left + 30;
      if (currentX > cutbox_left4 && currentX < cutbox_right4 && currentY > cutbox_top4 && currentY < cutbox_bottom4) {
        this._moveDuring();
        this.data._flag_cut_touch = true;
        this.data._flag_img_endtouch = true;
        this.data.CUT_START = {
          width: this.data.width,
          height: this.data.height,
          x: currentX,
          y: currentY,
          corner: 4
        }
      } else if (currentX > cutbox_left3 && currentX < cutbox_right3 && currentY > cutbox_top3 && currentY < cutbox_bottom3) {
        this._moveDuring();
        this.data._flag_cut_touch = true;
        this.data._flag_img_endtouch = true;
        this.data.CUT_START = {
          width: this.data.width,
          height: this.data.height,
          x: currentX,
          y: currentY,
          cut_top: this.data.cut_top,
          cut_left: this.data.cut_left,
          corner: 3
        }
      } else if (currentX > cutbox_left2 && currentX < cutbox_right2 && currentY > cutbox_top2 && currentY < cutbox_bottom2) {
        this._moveDuring();
        this.data._flag_cut_touch = true;
        this.data._flag_img_endtouch = true;
        this.data.CUT_START = {
          width: this.data.width,
          height: this.data.height,
          cut_top: this.data.cut_top,
          cut_left: this.data.cut_left,
          x: currentX,
          y: currentY,
          corner: 2
        }
      } else if (currentX > cutbox_left1 && currentX < cutbox_right1 && currentY > cutbox_top1 && currentY < cutbox_bottom1) {
        this._moveDuring();
        this.data._flag_cut_touch = true;
        this.data._flag_img_endtouch = true;
        this.data.CUT_START = {
          width: this.data.width,
          height: this.data.height,
          cut_top: this.data.cut_top,
          cut_left: this.data.cut_left,
          x: currentX,
          y: currentY,
          corner: 1
        }
      }
    },
    _cutTouchEnd(e) {
      this._moveStop();
      this.data._flag_cut_touch = false;
    },
    //停止移动时需要做的操作
    _moveStop() {
      //清空之前的自动居中延迟函数并添加最新的
      clearTimeout(this.data.TIME_CUT_CENTER);
      this.data.TIME_CUT_CENTER = setTimeout(() => {
        //动画启动
        if (!this.data._cut_animation) {
          this.setData({
            _cut_animation: true
          });
          this.setCutCenter();
          this.data.TIME_CUT_CENTER = setTimeout(() => {
            this.setData({
              _cut_animation: false
            });
          }, 400)
        }
      }, 1000)
      //清空之前的背景变化延迟函数并添加最新的
      clearTimeout(this.data.TIME_BG);
      this.data.TIME_BG = setTimeout(() => {
        if (this.data._flag_bright) {
          this.setData({
            _flag_bright: false
          });
        }
      }, 2000)
    },
    //移动中
    _moveDuring() {
      //清空之前的自动居中延迟函数
      clearTimeout(this.data.TIME_CUT_CENTER);
      if (this.data._cut_animation) {
        this.setData({
          _cut_animation: false
        });
      }
      //清空之前的背景变化延迟函数
      clearTimeout(this.data.TIME_BG);
      //高亮背景
      if (!this.data._flag_bright) {
        this.setData({
          _flag_bright: true
        });
      }
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

  }
})
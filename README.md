# image-cropper
## 一款高性能的小程序图片裁剪插件，支持旋转、设置尺寸
## 功能亮点
###### 1.支持旋转支持旋转支持旋转。
###### 2.性能超高超流畅，大图毫无卡顿感。
###### 3.可以设置导出图片尺寸。
###### 4.自由模式和限制模式随意切换。
###### 5.插件化，使用非常简单。
###### 6.点击中间窗口实时查看裁剪结果。
## 初始准备
#### 1.json文件中添加image-cropper
    "usingComponents": {
       "image-cropper": "../image-cropper/image-cropper"
    }
#### 2.wxml文件
	<image-cropper id="image-cropper" limit_move="true" disable_rotate="true" width="{{width}}" height="{{height}}" imgSrc="{{src}}" bindload="cropperload" bindimageload="loadimage" bindtapcut="clickcut"></image-cropper>
#### 3.wxss文件末尾
	@import '../plugin/image-cropper.wxss'  
#### 4.获取image-cropper对象
	this.cropper = this.selectComponent("#image-cropper");
	this.setData({
	  src:"https://raw.githubusercontent.com/1977474741/image-cropper/dev/image/code.jpg",
	});
## 参数说明
| 属性           | 类型   | 缺省值  | 取值  | 描述  | 必填 |
| ------------- |:------:|:------:|:-----:|:-----:|:-----:|
| imgSrc      	| String | 无	   |无限制|图片地址(如果是网络图片需配置安全域名)|否|
| disable_rotate| Boolean| false    |true/false|是否禁止用户旋转(为false时建议同时设置limit_move为false)|否|
| limit_move	| Boolean| false    |true/false|是否限制图片移动范围(裁剪框始终在图片内)(为true时建议同时设置disable_rotate为true)|否|
| width 	| Number | 200      |超过屏幕宽度自动转为屏幕宽度|裁剪框宽度|否|
| height        | Number | 200      |超过屏幕高度自动转为屏幕高度|裁剪框高度|否|
| export_scale  | Number | 3        |无限制|导出图片的大小比例(相对于裁剪框尺寸),决定了裁剪图片的尺寸|否|
| quality 	| Number | 1        |0-1|生成的图片质量|否|
| cut_top 	| Number | 居中     |始终在屏幕内 |裁剪框上边距|否|
| cut_left 	| Number | 居中     |始终在屏幕内 |裁剪框左边距|否|
| canvas_top 	| Number | -5000    |无限制(默认不显示-超出屏幕外) |canvas上边距|否|
| canvas_left 	| Number | -5000    |无限制(默认不显示-超出屏幕外) |canvas左边距|否|
| imgWidth 	| Number | 宽高都不设置，最小边填满裁剪框 |支持%(不加单位为px)(只设置宽度，高度自适应)|图片宽度|否|
| imgHeight 	| Number | 宽高都不设置，最小边填满裁剪框 |支持%(不加单位为px)(只设置高度，宽度自适应)|图片高度|否|
| scale 	| Number | 1	   |无限制|图片的缩放比|否|
| angle 	| Number | 0	   |无限制|图片的旋转角度|否|
| min_scale 	| Number | 0.5	   |无限制|图片的最小缩放比|否|
| bindload 	| Function | null	   |函数名称|cropper初始化完成|否|
| bindimageload | Function | null  |函数名称|图片加载完成,返回值Object{width,height,path,type}|否|
| bindtapcut 	| Function | null  |函数名称|点击中间裁剪框,返回值Object{src,width,height}|否|
## 函数说明
| 函数名         | 参数   	       | 返回值  |描述|参数必填|
| ------------- |:------:	   |:------:|:------:|:------:|
| upload      	|  无    	  |   无   |调起wx上传图片接口并开始剪裁|否|
| pushImg       |  src   	   |   无   |开始裁剪图片|是|
| getImg        |Function(回调函数) |   src  |获取裁剪之后的图片路径(图片尺寸 = 图片宽高 * export_scale)|是|
| setCutXY     	|  X、Y  	  |   无    |设置裁剪框位置|是|
| setCutSize    |  width、height   |   无    |设置裁剪框大小|是|
| setCutCenter  |  无   	   	  |   无    |设置裁剪框居中|否|
| setScale      |  scale   	   |   无    |设置图片缩放比例（不受min_scale、max_scale影响）|是|
| setAngle      |  deg   	   |   无    |设置图片旋转角度|是|
| setTransform  |{x,y,angle,scale,cutX,cutY}|   无    |图片在原有基础上的变化(scale受min_scale、max_scale影响)|根据需要传参|
| imgReset      |无	          |   无    |重置图片的角度、缩放、位置(可以在onloadImage回调里使用)|否|
<h2 align = "center" style="">体验Demo</h2>
<div align=center ><img width="250" height="250" src="https://raw.githubusercontent.com/1977474741/image-cropper/dev/image/code.jpg?v=0"/></div>

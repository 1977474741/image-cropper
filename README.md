# image-cropper
## 一款人性化的小程序图片裁剪插件，支持旋转
## 功能亮点
###### 1.支持旋转支持旋转支持旋转。
###### 2.点击中间窗口实时查看裁剪结果。
###### 3.使用非常简单，人性化。
## 初始准备
#### 1.json文件中添加image-cropper
	"usingComponents": {
			"image-cropper": "../plugin/image-cropper"
	},
#### 2.wxml文件
	<image-cropper id="cropper" min_scale="0.3" imgSrc="{{src}}" imgWidth="100%"></image-cropper>
#### 3.wxss文件末尾
	@import '../plugin/image-cropper.wxss'  
#### 4.获取image-cropper对象
	this.cropper = this.selectComponent("#cropper");
	this.setData({
	  src:"https://raw.githubusercontent.com/1977474741/image-cropper/dev/image/code.jpg",
	});
	//点击裁剪框回调
	this.cropper.clickCallback((url)=>{
	  //图片预览
	  wx.previewImage({
	    current: url, // 当前显示图片的http链接
	    urls: [url] // 需要预览的图片http链接列表
	  })
	}) 
## 参数说明
| 属性           | 类型   | 缺省值  | 取值  | 描述  | 必填 |
| ------------- |:------:|:------:|:-----:|:-----:|:-----:|
| imgSrc      	| String | 无	   |无限制|图片地址|否|
| disable_rotate| Boolean| false    |true/false|是否禁止用户旋转|否|
| width 	| Number | 200      |超过屏幕宽度自动转为屏幕宽度|裁剪框宽度|否|
| height        | Number | 200      |超过屏幕高度自动转为屏幕高度|裁剪框高度|否|
| quality 	| Number | 1        |0-1|生成的图片质量|否|
| cut_top 	| Number | 居中     |始终在屏幕内 |裁剪框上边距|否|
| cut_left 	| Number | 居中     |始终在屏幕内 |裁剪框左边距|否|
| canvas_top 	| Number | -3000    |无限制(默认不显示-超出屏幕外) |canvas上边距|否|
| canvas_left 	| Number | 0        |无限制(默认不显示-超出屏幕外) |canvas左边距|否|
| imgWidth 	| Number | 图片的原宽度 |支持%(不加单位为px)(只设置宽度，高度自适应)|图片宽度|否|
| imgHeight 	| Number | 图片的原高度 |支持%(不加单位为px)(只设置高度，宽度自适应)|图片高度|否|
| scale 	| Number | 1	   |无限制|图片的缩放比|否|
| min_scale 	| Number | 0.5	   |无限制|图片的最小缩放比|否|
| max_scale 	| Number | 2	   |无限制|图片的最大缩放比|否|
| rotate 	| Number | 0	   |无限制|图片的旋转角度|否|
## 函数说明
| 函数名         | 参数   	       | 返回值  |描述|参数必填|
| ------------- |:------:	   |:------:|:------:|:------:|
| upload      	|  无    	  |   无   |调起wx上传图片接口并开始剪裁|否|
| pushImg       |  src   	   |   无   |开始裁剪图片|是|
| getImg        |Function(回调函数) |   src  |获取裁剪之后的图片路径|是|
| setWidth     	|  width   	   |   无    |设置裁剪框宽度|是|
| setHeight     |  height   	   |   无    |设置裁剪框高度|是|
| cutCenter     |  无   	   	  |   无    |设置裁剪框居中|否|
| setScale      |  scale   	   |   无    |设置图片缩放比例（不受min_scale、max_scale影响）|是|
| setRotate     |  deg   	   |   无    |设置图片旋转角度|是|
| setTransform  |{x,y,rotate,scale,cutX,cutY}|   无    |图片在原有基础上的变化(scale受min_scale、max_scale影响)|根据需要传参|
## 事件说明
| 事件名         | 参数   	       | 返回值  |描述|参数必填|
| ------------- |:------:	   |:------:|:------:|:------:|
| clickCallback |Function(回调函数)|src(当前裁剪后的图片地址) |用户点击中间裁剪框|是|
<h2 align = "center" style="">体验Demo</h2>
<div align=center ><img width="250" height="250" src="https://raw.githubusercontent.com/1977474741/image-cropper/dev/image/code.jpg?v=0"/></div>

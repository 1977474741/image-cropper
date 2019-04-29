  <view class='image-cropper' catchtouchmove='_preventTouchMove'>
    <view class='main' bindtouchend="_cutTouchEnd" bindtouchstart="_cutTouchStart" bindtouchmove="_cutTouchMove" bindtap="_click">
      <view class='content'>
        <view class='content_top bg_gray {{_flag_bright?"":"bg_black"}}' style="height:{{cut_top}}px;transition-property:{{_cut_animation?'':'background'}}"></view>
        <view class='content_middle' style="height:{{height}}px;">
          <view class='content_middle_left bg_gray {{_flag_bright?"":"bg_black"}}' style="width:{{cut_left}}px;transition-property:{{_cut_animation?'':'background'}}"></view>
          <view class='content_middle_middle' style="width:{{width}}px;height:{{height}}px;transition-duration: .3s;transition-property:{{_cut_animation?'':'background'}};">
            <view class="border border-top-left"></view>
            <view class="border border-top-right"></view>
            <view class="border border-right-top"></view>
            <view class="border border-right-bottom"></view>
            <view class="border border-bottom-right"></view>
            <view class="border border-bottom-left"></view>
            <view class="border border-left-bottom"></view>
            <view class="border border-left-top"></view>
          </view>
          <view class='content_middle_right bg_gray {{_flag_bright?"":"bg_black"}}' style="transition-property:{{_cut_animation?'':'background'}}"></view>
        </view>
        <view class='content_bottom bg_gray {{_flag_bright?"":"bg_black"}}' style="transition-property:{{_cut_animation?'':'background'}}"></view>
      </view>
      <image bindload="imageLoad" bindtouchstart="_start" bindtouchmove="_move" bindtouchend="_end" style="width:{{img_width ? img_width + 'px' : 'auto'}};height:{{img_height ? img_height + 'px' : 'auto'}};transform:translate3d({{_img_left-img_width/2}}px,{{_img_top-img_height/2}}px,0) scale({{scale}}) rotate({{angle}}deg);transition-duration:{{_cut_animation?.4:0}}s;" class='img' src='{{imgSrc}}'></image>
    </view>
    <canvas canvas-id='image-cropper' disable-scroll="true" style="width:{{_canvas_width * export_scale}}px;height:{{_canvas_height * export_scale}}px;left:{{canvas_left}}px;top:{{canvas_top}}px" class='image-cropper-canvas'></canvas>
  </view>

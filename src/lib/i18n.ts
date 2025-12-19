export type Language = 'en' | 'zh'

export const translations = {
  en: {
    common: {
      loading: "Loading...",
      download: "Download",
      upload: "Upload",
      replace: "Replace",
    },
    nav: {
      screenshot_studio: "Screenshot Studio",
      icon_illustration: "Icon & Illustration",
      ad_video: "Ad Video Generator",
      ai_chat: "AI Chat Assistant",
      my_gallery: "My Gallery",
      billing: "Billing & Credits",
    },
    screenshot: {
      title: "Screenshot Studio",
      subtitle: "Generate stunning App Store screenshots from prompts.",
      generator: {
        title: "Generator",
        description: "Describe your app interface to generate a screenshot.",
        prompt_label: "Prompt",
        prompt_placeholder: "A modern fintech dashboard showing stock charts in dark mode...",
        model_label: "Model",
        select_model: "Select a model",
        btn_generate: "Generate iPhone 6.7\" Screenshot",
        btn_generating: "Phase 1: Generating Image...",
        btn_upscaling: "Phase 2: Enhancing to 4K...",
        status_generating: "AI is dreaming up your screenshot... (approx 15s)",
        status_upscaling: "Upscaling to ultra-high resolution... (approx 5s)",
      },
      result: {
        empty_state: "Your generated iPhone screenshot will appear here",
        download_btn: "Download 1290x2796",
      },
      resizer: {
        title: "Resizer Tool",
        description: "Batch process your screenshot into multiple device sizes.",
        source_title: "Source Image",
        no_image: "No image selected",
        upload_btn: "Upload Image",
        target_sizes: "Target Sizes",
        btn_generate_all: "Generate All Sizes",
        btn_processing: "Processing...",
        iphone: "IPHONE",
        ipad: "IPAD",
        previews: "Generated Previews",
        download_zip: "Download All (ZIP) - Coming Soon",
        empty_previews: "Generated variations will appear here",
      },
      messages: {
        prompt_required: "Please enter a prompt",
        server_busy: "Server busy due to high traffic. Please try again in a few seconds.",
        generate_success: "AI generated successfully! Enhancing quality...",
        enhance_success: "Image enhanced to iPhone 14 Pro Max resolution!",
        enhance_failed: "Enhancement failed, keeping original quality.",
        upload_success: "Reference image uploaded",
        batch_success: "Generated {count} variations!",
        error_generic: "Something went wrong",
      }
    }
  },
  zh: {
    common: {
      loading: "加载中...",
      download: "下载",
      upload: "上传",
      replace: "替换",
    },
    nav: {
      screenshot_studio: "截图工坊",
      icon_illustration: "图标与插画",
      ad_video: "广告视频生成",
      ai_chat: "AI 助手",
      my_gallery: "我的图库",
      billing: "账单与点数",
    },
    screenshot: {
      title: "截图工坊",
      subtitle: "通过提示词生成精美的 App Store 截图。",
      generator: {
        title: "生成器",
        description: "描述您的 App 界面以生成截图。",
        prompt_label: "提示词",
        prompt_placeholder: "一个现代化的金融 App 仪表盘，深色模式，显示股票走势图...",
        model_label: "模型",
        select_model: "选择模型",
        btn_generate: "生成 iPhone 6.7\" 截图",
        btn_generating: "第一阶段：正在生成图片...",
        btn_upscaling: "第二阶段：正在增强至 4K...",
        status_generating: "AI 正在构思您的截图... (约 15秒)",
        status_upscaling: "正在放大至超高分辨率... (约 5秒)",
      },
      result: {
        empty_state: "您生成的 iPhone 截图将显示在这里",
        download_btn: "下载 1290x2796",
      },
      resizer: {
        title: "多尺寸工具",
        description: "批量将截图处理为多种设备尺寸。",
        source_title: "源图片",
        no_image: "未选择图片",
        upload_btn: "上传图片",
        target_sizes: "目标尺寸",
        btn_generate_all: "生成所有尺寸",
        btn_processing: "处理中...",
        iphone: "iPhone 系列",
        ipad: "iPad 系列",
        previews: "生成预览",
        download_zip: "打包下载 (ZIP) - 即将推出",
        empty_previews: "生成的变体将显示在这里",
      },
      messages: {
        prompt_required: "请输入提示词",
        server_busy: "服务器繁忙，请稍后再试。",
        generate_success: "AI 生成成功！正在增强画质...",
        enhance_success: "图片已增强至 iPhone 14 Pro Max 分辨率！",
        enhance_failed: "画质增强失败，保留原始质量。",
        upload_success: "参考图已上传",
        batch_success: "成功生成 {count} 个变体！",
        error_generic: "出错了，请重试",
      }
    }
  }
}

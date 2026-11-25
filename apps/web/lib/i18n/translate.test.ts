import { describe, expect, it } from "vitest";
import { installZhLocale, translateAttribute, translateTextContent } from "./translate";

describe("translateTextContent", () => {
  it("replaces an exact dictionary phrase", () => {
    expect(translateTextContent("Settings")).toBe("设置");
  });

  it("preserves leading and trailing whitespace", () => {
    expect(translateTextContent("  New chat  ")).toBe("  新建对话  ");
  });

  it("falls back to the original when there is no match", () => {
    expect(translateTextContent("Some model prose here")).toBe("Some model prose here");
  });

  it("returns empty and whitespace unchanged", () => {
    expect(translateTextContent("")).toBe("");
    expect(translateTextContent("   ")).toBe("   ");
  });

  it("leaves already-Chinese text untouched", () => {
    expect(translateTextContent("中文设置")).toBe("中文设置");
  });
});

describe("translateTextContent patterns", () => {
  it("translates a phrase with an embedded number", () => {
    expect(translateTextContent("5 messages")).toBe("5 条消息");
    expect(translateTextContent("3 chats")).toBe("3 个对话");
  });
});

describe("batch 1 dictionary (auth + chat)", () => {
  it("translates auth labels", () => {
    expect(translateTextContent("Welcome back")).toBe("欢迎回来");
    expect(translateTextContent("Email")).toBe("电子邮箱");
    expect(translateTextContent("Signing in…")).toBe("正在登录…");
  });

  it("translates chat action labels", () => {
    expect(translateTextContent("Regenerate")).toBe("重新生成");
    expect(translateTextContent("Continue response")).toBe("继续生成");
    expect(translateTextContent("Copied")).toBe("已复制");
  });

  it("keeps error details untranslated", () => {
    // Error details are intentionally not in the dictionary.
    expect(translateTextContent("Failed to copy")).toBe("Failed to copy");
    expect(translateTextContent("Clipboard access was denied by the browser.")).toBe(
      "Clipboard access was denied by the browser.",
    );
  });
});

describe("batch 1 dictionary (composer + top bar + chain of thought)", () => {
  it("translates composer menu and status labels", () => {
    expect(translateTextContent("Add photos & files")).toBe("添加照片与文件");
    expect(translateTextContent("Web search")).toBe("网页搜索");
  });

  it("translates composer placeholders", () => {
    expect(translateAttribute("placeholder", "Message… or / for commands")).toBe(
      "发消息…（输入 / 唤出命令）",
    );
  });

  it("translates neutral chain-of-thought status labels", () => {
    expect(translateTextContent("Thinking")).toBe("思考");
    expect(translateTextContent("Thought for 12s")).toBe("思考了 12 秒");
  });

  it("leaves failure status labels untranslated (error detail policy)", () => {
    expect(translateTextContent("Web search failed")).toBe("Web search failed");
    expect(translateTextContent("Code run did not complete")).toBe("Code run did not complete");
  });
});

describe("batch 1 dictionary (sidebar + account menu)", () => {
  it("translates account and sidebar items", () => {
    expect(translateTextContent("Profile")).toBe("个人资料");
    expect(translateTextContent("Log out")).toBe("退出登录");
    expect(translateTextContent("Close")).toBe("关闭");
    expect(translateAttribute("placeholder", "e.g. Work — weekly review")).toBe("例如：工作 — 每周总结");
  });
});

describe("batch 1 dictionary (model picker + two-factor + signup + share)", () => {
  it("translates model picker labels", () => {
    expect(translateTextContent("Select model")).toBe("选择模型");
    expect(translateAttribute("placeholder", "Search models")).toBe("搜索模型");
  });

  it("translates two-factor and signup labels", () => {
    expect(translateTextContent("Two-factor authentication")).toBe("两步验证");
    expect(translateTextContent("Create account")).toBe("创建账户");
  });

  it("translates the share dialog title", () => {
    expect(translateAttribute("title", "Share chat")).toBe("分享对话");
  });
});

describe("batch 1 dynamic patterns and exact precedence", () => {
  it("translates dynamic Remove/Generating/pages strings", () => {
    expect(translateTextContent("Remove report.pdf")).toBe("移除 report.pdf");
    expect(translateTextContent("Generating response for My Chat")).toBe("正在为「My Chat」生成回复");
    expect(translateTextContent("7 pages")).toBe("7 页");
  });

  it("prefers the exact dictionary over the generic Remove pattern", () => {
    expect(translateTextContent("Remove Web search from this message")).toBe("从本消息移除网页搜索");
  });

  it("translates share and dictation labels", () => {
    expect(translateTextContent("Copy link")).toBe("复制链接");
    expect(translateTextContent("Transcribing")).toBe("转录中");
  });
});

describe("batch 2 dictionary (settings nav + general + security + profile)", () => {
  it("translates settings navigation labels", () => {
    expect(translateTextContent("General")).toBe("通用");
    expect(translateTextContent("Security")).toBe("安全");
    expect(translateTextContent("Personalization")).toBe("个性化");
  });

  it("translates general settings options", () => {
    expect(translateTextContent("Dark")).toBe("深色");
    expect(translateTextContent("System")).toBe("跟随系统");
    expect(translateTextContent("Accent color")).toBe("强调色");
  });

  it("translates security and profile labels", () => {
    expect(translateTextContent("Change password")).toBe("修改密码");
    expect(translateTextContent("Turn off two-factor")).toBe("关闭两步验证");
    expect(translateTextContent("Save profile")).toBe("保存资料");
  });

  it("keeps runtime error notices untranslated (error detail policy)", () => {
    expect(translateTextContent("Could not load two-factor status.")).toBe(
      "Could not load two-factor status.",
    );
    expect(translateTextContent("Display name is required.")).toBe("Display name is required.");
  });
});

describe("batch 2 dictionary (data + personalization + tools + services)", () => {
  it("translates data import/export labels", () => {
    expect(translateTextContent("Choose file")).toBe("选择文件");
    expect(translateTextContent("Download export")).toBe("下载导出文件");
    expect(translateTextContent("No shared chats.")).toBe("暂无分享的对话。");
  });

  it("translates memory manager labels", () => {
    expect(translateTextContent("Saved memories")).toBe("已保存记忆");
    expect(translateTextContent("Add memory")).toBe("添加记忆");
    expect(translateTextContent("Clear all")).toBe("全部清除");
  });

  it("translates usage percent and connector strings via patterns", () => {
    expect(translateTextContent("42% used")).toBe("42% 已用");
    expect(translateTextContent("Sign in once to connect Gmail and Calendar")).toBe(
      "登录一次即可连接 Gmail and Calendar",
    );
    expect(translateTextContent("Connected")).toBe("已连接");
    expect(translateTextContent("On demand")).toBe("按需");
  });

  it("keeps connector failure toasts untranslated (error detail policy)", () => {
    expect(translateTextContent("Failed to disconnect Google")).toBe(
      "Failed to disconnect Google",
    );
  });
});

describe("batch 2 dictionary (models + users + agent connections)", () => {
  it("translates models panel labels", () => {
    expect(translateTextContent("Background tasks")).toBe("后台任务");
    expect(translateTextContent("No models configured.")).toBe("尚未配置任何模型。");
    expect(translateTextContent("Move up")).toBe("上移");
  });

  it("translates model editor sections", () => {
    expect(translateTextContent("Model type")).toBe("模型类型");
    expect(translateTextContent("Context window")).toBe("上下文窗口");
    expect(translateTextContent("Cache read")).toBe("缓存读取");
  });

  it("translates users and connections labels", () => {
    expect(translateTextContent("Role")).toBe("角色");
    expect(translateTextContent("Actions")).toBe("操作");
    expect(translateTextContent("Project folder")).toBe("项目文件夹");
    expect(translateTextContent("This server")).toBe("本服务器");
  });
});

describe("batch 3 dictionary (library + projects + voice + agents)", () => {
  it("translates library and project labels", () => {
    expect(translateTextContent("Search library")).toBe("搜索库");
    expect(translateTextContent("Delete project")).toBe("删除项目");
    expect(translateTextContent("Account default")).toBe("账户默认");
  });

  it("translates voice status labels", () => {
    expect(translateTextContent("Listening to you")).toBe("正在聆听");
    expect(translateTextContent("Speaking")).toBe("正在发言");
  });

  it("translates agent workspace labels", () => {
    expect(translateTextContent("No agent sessions yet")).toBe("还没有智能体会话");
    expect(translateTextContent("In progress")).toBe("进行中");
    expect(translateTextContent("Switch branch")).toBe("切换分支");
  });

  it("keeps voice error texts untranslated (error detail policy)", () => {
    expect(translateTextContent("Microphone access was denied. Allow it in your browser and try again.")).toBe(
      "Microphone access was denied. Allow it in your browser and try again.",
    );
  });
});

describe("batch 3 tail (model editor deep + mcp editor + google dialogs + activity)", () => {
  it("translates model editor deep fields", () => {
    expect(translateTextContent("Add model")).toBe("添加模型");
    expect(translateTextContent("Available in chat")).toBe("在聊天中可用");
    expect(translateTextContent("Fetched models")).toBe("已获取的模型");
  });

  it("translates MCP editor fields", () => {
    expect(translateTextContent("Transport")).toBe("传输方式");
    expect(translateTextContent("Command to launch")).toBe("启动命令");
    expect(translateTextContent("Working directory")).toBe("工作目录");
  });

  it("translates google dialog steps and activity labels", () => {
    expect(translateTextContent("Sign in with Google")).toBe("使用 Google 登录");
    expect(translateTextContent("Paste it here")).toBe("粘贴到这里");
    expect(translateTextContent("Ranked by chat tokens")).toBe("按聊天 token 排名");
  });
});

describe("batch 4 dictionary (upstream v0.36.0: scheduled tasks + replies + two-factor + sidebar)", () => {
  it("translates scheduled task pages and dialogs", () => {
    expect(translateTextContent("No scheduled tasks yet")).toBe("暂无定时任务");
    expect(translateTextContent("Tasks run by themselves at the times you set. Each run opens a new chat.")).toBe(
      "任务会在你设定的时间自动运行，每次运行都会新建一个对话。"
    );
    expect(translateTextContent("Delete task?")).toBe("删除任务？");
    expect(translateTextContent("Run now")).toBe("立即运行");
  });

  it("translates quoted replies and two-factor prompts", () => {
    expect(translateTextContent("Quoted text")).toBe("引用的文本");
    expect(translateTextContent("Remove quote")).toBe("移除引用");
    expect(translateTextContent("Protect your account")).toBe("保护你的账户");
    expect(translateTextContent("You can always find this in Settings → Security.")).toBe(
      "随时可以在「设置 → 安全」中找到。"
    );
  });

  it("translates the renamed alerts strings (upstream dropped 'Agent alerts')", () => {
    expect(translateTextContent("Alerts")).toBe("提醒");
    expect(translateTextContent("A short chime when a reply is done.")).toBe("回复完成时播放简短提示音。");
    expect(translateTextContent("Agent alerts")).toBe("Agent alerts");
  });

  it("translates sidebar refresh labels", () => {
    expect(translateTextContent("New project")).toBe("新建项目");
    expect(translateTextContent("Mark all as read")).toBe("全部标为已读");
    expect(translateTextContent("Files from your saved chats. Reuse them with “Add from library” in any chat.")).toBe(
      "来自已保存对话的文件。在任意对话中都可以通过「从库添加」复用它们。"
    );
  });
});

describe("batch 4 schedule summary patterns", () => {
  it("translates fixed schedule forms before the generic weekday rule", () => {
    expect(translateTextContent("Every day at 9:00 AM")).toBe("每天 9:00 AM");
    expect(translateTextContent("Every hour at :05")).toBe("每小时第 05 分钟");
    expect(translateTextContent("Weekdays at 8:00 AM")).toBe("工作日 8:00 AM");
    expect(translateTextContent("Monthly on the 3rd at 10:00 AM")).toBe("每月 3 日 10:00 AM");
    expect(translateTextContent("Once on Jan 5 at 9:00 AM")).toBe("仅一次：Jan 5 9:00 AM");
  });

  it("translates weekday-list schedules through the generic rule", () => {
    expect(translateTextContent("Every Monday at 9:00 AM")).toBe("每周一 9:00 AM");
    expect(translateTextContent("Every Monday and Friday at 9:00 AM")).toBe("每周一、周五 9:00 AM");
    expect(translateTextContent("Every Monday, Wednesday and Friday at 9:00 AM")).toBe("每周一、周三、周五 9:00 AM");
  });
});

describe("translateAttribute", () => {
  it("translates a supported attribute value", () => {
    expect(translateAttribute("placeholder", "Search")).toBe("搜索");
  });

  it("ignores attributes outside the supported set", () => {
    expect(translateAttribute("href", "Search")).toBe("Search");
  });
});

describe("installZhLocale", () => {
  it("is a safe no-op without a DOM and returns a cleanup function", () => {
    const cleanup = installZhLocale();
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup()).not.toThrow();
  });
});

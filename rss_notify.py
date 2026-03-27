#!/usr/bin/env python3
"""
RSS 邮箱订阅管理 & 新文章通知脚本

功能：
1. 添加/删除订阅者邮箱
2. 发新文章时，给所有订阅者发送邮件通知

使用方式：
  # 添加订阅者
  python rss_notify.py add someone@example.com

  # 删除订阅者
  python rss_notify.py remove someone@example.com

  # 查看所有订阅者
  python rss_notify.py list

  # 发送新文章通知（交互式输入标题和链接）
  python rss_notify.py notify

  # 发送新文章通知（命令行参数）
  python rss_notify.py notify --title "文章标题" --url "https://..." --excerpt "文章摘要"
"""

import json
import os
import sys
import smtplib
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# 配置
SUBSCRIBERS_FILE = os.path.join(os.path.dirname(__file__), "subscribers.json")
SENDER_EMAIL = "448795033@qq.com"
SENDER_NAME = "夏之朝露"
SMTP_SERVER = "smtp.qq.com"
SMTP_PORT = 465
# 授权码从环境变量读取
SMTP_AUTH_CODE = os.environ.get("QQ_EMAIL_AUTH_CODE", "vbbumnuqkkczbgij")

SITE_URL = "https://www.dewai.info"
RSS_URL = "https://www.dewai.info/feed.xml"


def load_subscribers():
    """加载订阅者列表"""
    if os.path.exists(SUBSCRIBERS_FILE):
        with open(SUBSCRIBERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_subscribers(subscribers):
    """保存订阅者列表"""
    with open(SUBSCRIBERS_FILE, "w", encoding="utf-8") as f:
        json.dump(subscribers, f, ensure_ascii=False, indent=2)


def add_subscriber(email):
    """添加订阅者"""
    subscribers = load_subscribers()
    # 检查是否已存在
    existing_emails = [s["email"] for s in subscribers]
    if email in existing_emails:
        print(f"⚠️  {email} 已经在订阅列表中")
        return
    subscribers.append({
        "email": email,
        "subscribed_at": datetime.now().isoformat(),
    })
    save_subscribers(subscribers)
    print(f"✅ 已添加订阅者: {email}")


def remove_subscriber(email):
    """删除订阅者"""
    subscribers = load_subscribers()
    new_list = [s for s in subscribers if s["email"] != email]
    if len(new_list) == len(subscribers):
        print(f"⚠️  {email} 不在订阅列表中")
        return
    save_subscribers(new_list)
    print(f"✅ 已移除订阅者: {email}")


def list_subscribers():
    """列出所有订阅者"""
    subscribers = load_subscribers()
    if not subscribers:
        print("📭 暂无订阅者")
        return
    print(f"\n📬 共 {len(subscribers)} 位订阅者:\n")
    for i, sub in enumerate(subscribers, 1):
        print(f"  {i}. {sub['email']}  (订阅于 {sub['subscribed_at'][:10]})")
    print()


def build_notification_html(title, url, excerpt=""):
    """构建通知邮件 HTML"""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0e17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-family:monospace;font-size:20px;color:#38bdf8;">&lt;Xialu /&gt;</span>
      <p style="color:#94a3b8;font-size:14px;margin-top:8px;">夏之朝露 · 新文章通知</p>
    </div>

    <!-- Card -->
    <div style="background:#1a1f2e;border:1px solid rgba(148,163,184,0.1);border-radius:12px;padding:32px;margin-bottom:24px;">
      <p style="color:#38bdf8;font-size:14px;font-family:monospace;margin:0 0 12px;">📝 新文章发布</p>
      <h1 style="color:#e2e8f0;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.4;">{title}</h1>
      {f'<p style="color:#94a3b8;font-size:15px;line-height:1.8;margin:0 0 24px;">{excerpt}</p>' if excerpt else ''}
      <a href="{url}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
        阅读全文 →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid rgba(148,163,184,0.1);">
      <p style="color:#64748b;font-size:12px;margin:0;">
        你收到此邮件是因为你订阅了「夏之朝露」
        <br>
        <a href="{SITE_URL}" style="color:#38bdf8;text-decoration:none;">访问主页</a> · 
        <a href="{RSS_URL}" style="color:#38bdf8;text-decoration:none;">RSS 订阅</a>
      </p>
      <p style="color:#475569;font-size:11px;margin-top:12px;">
        如需退订，请回复此邮件告知
      </p>
    </div>
  </div>
</body>
</html>"""


def send_notification(title, url, excerpt=""):
    """发送新文章通知给所有订阅者"""
    subscribers = load_subscribers()
    if not subscribers:
        print("📭 暂无订阅者，无需发送")
        return

    html_content = build_notification_html(title, url, excerpt)
    subject = f"📝 夏之朝露 | {title}"

    print(f"\n📤 开始发送通知...")
    print(f"   标题: {title}")
    print(f"   链接: {url}")
    print(f"   订阅者: {len(subscribers)} 人\n")

    success_count = 0
    fail_count = 0

    try:
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(SENDER_EMAIL, SMTP_AUTH_CODE)

        for sub in subscribers:
            try:
                msg = MIMEMultipart("alternative")
                msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
                msg["To"] = sub["email"]
                msg["Subject"] = subject

                # 纯文本版本
                text_content = f"夏之朝露 · 新文章\n\n{title}\n\n{excerpt}\n\n阅读全文: {url}\n\n---\n退订请回复此邮件"
                msg.attach(MIMEText(text_content, "plain", "utf-8"))
                msg.attach(MIMEText(html_content, "html", "utf-8"))

                server.sendmail(SENDER_EMAIL, sub["email"], msg.as_string())
                print(f"   ✅ {sub['email']}")
                success_count += 1
            except Exception as e:
                print(f"   ❌ {sub['email']} - 发送失败: {e}")
                fail_count += 1

        server.quit()
    except Exception as e:
        print(f"\n❌ SMTP 连接失败: {e}")
        return

    print(f"\n📊 发送完成: {success_count} 成功, {fail_count} 失败")


def main():
    parser = argparse.ArgumentParser(description="RSS 邮箱订阅管理 & 通知")
    subparsers = parser.add_subparsers(dest="command")

    # add
    add_parser = subparsers.add_parser("add", help="添加订阅者")
    add_parser.add_argument("email", help="订阅者邮箱")

    # remove
    rm_parser = subparsers.add_parser("remove", help="移除订阅者")
    rm_parser.add_argument("email", help="订阅者邮箱")

    # list
    subparsers.add_parser("list", help="列出所有订阅者")

    # notify
    notify_parser = subparsers.add_parser("notify", help="发送新文章通知")
    notify_parser.add_argument("--title", help="文章标题")
    notify_parser.add_argument("--url", help="文章链接")
    notify_parser.add_argument("--excerpt", help="文章摘要", default="")

    args = parser.parse_args()

    if args.command == "add":
        add_subscriber(args.email)
    elif args.command == "remove":
        remove_subscriber(args.email)
    elif args.command == "list":
        list_subscribers()
    elif args.command == "notify":
        title = args.title
        url = args.url
        excerpt = args.excerpt

        if not title:
            title = input("📝 文章标题: ").strip()
        if not url:
            url = input("🔗 文章链接: ").strip()
        if not excerpt:
            excerpt = input("📄 文章摘要 (可选，直接回车跳过): ").strip()

        if not title or not url:
            print("❌ 标题和链接不能为空")
            return

        send_notification(title, url, excerpt)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

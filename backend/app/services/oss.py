"""阿里云 OSS 工具类：执行记录/打卡附件的上传、访问与删除。

配置项取自 .env（见 app.config.Settings）：
    ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET
    ALIYUN_OSS_ENDPOINT / ALIYUN_OSS_BUCKET_NAME / ALIYUN_OSS_REGION

用法：
    from app.services.oss import oss_storage, OSSError

    info = oss_storage.upload_attachment(file_bytes, "作业照片.jpg")
    # info -> {"key": "attachments/20260809/xxxx.jpg", "url": "https://..."}

    url = oss_storage.get_signed_url(info["key"], expires=3600)
    oss_storage.delete(info["key"])

说明：方法均为同步实现（oss2 SDK 为阻塞式），小附件可直接调用；
大文件建议在路由中通过 anyio.to_thread.run_sync 包装，避免阻塞事件循环。
"""
import re
import uuid
from datetime import datetime

from app.config import settings


class OSSError(Exception):
    """OSS 操作失败（配置缺失、网络错误、权限不足等）。"""


# 上传时仅保留常见安全扩展名，其余统一按 .bin 处理
_SAFE_EXTS = {
    "jpg", "jpeg", "png", "gif", "webp", "bmp",
    "mp4", "mov", "m4v", "avi", "mp3", "wav", "m4a",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "txt", "md", "zip",
}


class OSSStorage:
    """阿里云 OSS 存储客户端（惰性初始化，全局单例使用）。"""

    def __init__(self):
        self._bucket = None

    @property
    def bucket(self):
        """惰性构造 oss2.Bucket，未配置时抛 OSSError。"""
        if self._bucket is None:
            if not (settings.aliyun_access_key_id and settings.aliyun_access_key_secret
                    and settings.aliyun_oss_endpoint and settings.aliyun_oss_bucket_name):
                raise OSSError("阿里云 OSS 未配置，请检查 .env 中的 ALIYUN_* 配置项")
            try:
                import oss2
            except ImportError:
                raise OSSError("缺少 oss2 依赖，请先执行 pip install oss2")
            auth = oss2.Auth(settings.aliyun_access_key_id, settings.aliyun_access_key_secret)
            self._bucket = oss2.Bucket(auth, settings.aliyun_oss_endpoint,
                                       settings.aliyun_oss_bucket_name)
        return self._bucket

    # ── 上传 ──

    def upload_attachment(self, data: bytes, filename: str,
                          prefix: str = "attachments") -> dict:
        """上传附件，返回 {"key": 对象键, "url": 公网访问地址}。

        对象键格式：{prefix}/{YYYYMMDD}/{uuid}.{ext}，按天归档便于管理。
        """
        if not data:
            raise OSSError("上传内容为空")
        key = self.build_key(filename, prefix)
        try:
            self.bucket.put_object(key, data)
        except Exception as e:
            raise OSSError(f"OSS 上传失败: {e}") from e
        return {"key": key, "url": self.get_public_url(key)}

    # ── 访问 ──

    def get_public_url(self, key: str) -> str:
        """拼接公网访问地址（Bucket 需为公共读，或配合签名 URL 使用）。"""
        endpoint = settings.aliyun_oss_endpoint.replace("https://", "").replace("http://", "")
        return f"https://{settings.aliyun_oss_bucket_name}.{endpoint}/{key}"

    def get_signed_url(self, key: str, expires: int = 3600) -> str:
        """生成带签名的临时访问 URL（私有 Bucket 使用），expires 单位秒。"""
        try:
            return self.bucket.sign_url("GET", key, expires, slash_safe=True)
        except Exception as e:
            raise OSSError(f"生成签名 URL 失败: {e}") from e

    # ── 删除 ──

    def delete(self, key: str) -> None:
        """删除对象；对象不存在时 OSS 也返回成功，无需额外判断。"""
        try:
            self.bucket.delete_object(key)
        except Exception as e:
            raise OSSError(f"OSS 删除失败: {e}") from e

    # ── 工具 ──

    @staticmethod
    def build_key(filename: str, prefix: str = "attachments") -> str:
        """按「前缀/日期/uuid.扩展名」生成对象键，过滤不安全的扩展名。"""
        ext = (filename.rsplit(".", 1)[-1].lower() if "." in (filename or "") else "")
        if not re.fullmatch(r"[a-z0-9]{1,8}", ext or "") or ext not in _SAFE_EXTS:
            ext = "bin"
        day = datetime.now().strftime("%Y%m%d")
        return f"{prefix}/{day}/{uuid.uuid4().hex}.{ext}"


# 全局单例，路由/服务直接引用
oss_storage = OSSStorage()

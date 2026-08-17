# 生产部署调试记录

## 2026-08-17 进度

### 已完成
- 后端上传已全部走 OSS，删除了旧的本地上传接口（`executions.py` 的 `/daily-executions/{exec_id}/upload`）和 `main.py` 的 `/uploads` 挂载
- `backend/config/nginx.conf.example` 更新为生产版（静态资源 + SPA 回退 + `/api/` 反代，已删 `/uploads/` 代理）
- 生产服务器 nginx 配置完成，外网 IP 访问页面正常（之前的 403 已解决）
- 服务器实际用户为 `ecs-assist-user`，项目路径 `/home/ecs-assist-user/codedir/myvocation`

### 当前卡点（明天从这里继续）
`myvocation.service` 起不来，`systemctl status` 显示：

```
Active: activating (auto-restart) (Result: exit-code)
Main PID: xxxx (code=exited, status=217/USER)
```

- `status=217/USER` = `User=` 指定的用户无效，进程启动前就被拒绝（所以 journalctl 无日志）
- 原因：service 文件里写的是 `User=xiaoman`（示例值），服务器上不存在该用户
- 用户改过一次但错误依旧，**怀疑改完没执行 `daemon-reload`，或文件里没改对**

### 明天排查步骤
1. `id ecs-assist-user` — 确认用户名拼写
2. `cat /etc/systemd/system/myvocation.service` — 看 `User=` 实际内容（上次还没发出来）
3. 确认三项配置：
   ```ini
   User=ecs-assist-user
   WorkingDirectory=/home/ecs-assist-user/codedir/myvocation/backend
   ExecStart=/home/ecs-assist-user/codedir/myvocation/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 3001 --workers 2
   ```
4. 改完必须 `sudo systemctl daemon-reload && sudo systemctl restart myvocation`
5. 验证：`ss -tlnp | grep 3001` → `curl http://127.0.0.1/api/health`
6. 若仍失败，手动跑 `venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 3001` 看屏幕报错
   （日志要看全需 `sudo journalctl -u myvocation -n 30 --no-pager`）

### 待办（服务起通之后）
- [ ] 修 `backend/.env`：`DEBUG=release` 会导致 pydantic 解析失败，改 `DEBUG=false`（`release` 应放 `APP_ENV`）
- [ ] 确认服务器已 `pip install oss2`，`.env` 已配 `ALIYUN_*`，否则上传接口 502
- [ ] 确认服务器上 `frontend/dist` 是 `npm run build` 最新产物
- [ ] 有域名后 `certbot --nginx` 上 HTTPS
- [ ] 备份机制：`backend/db/app.db`（SQLite）

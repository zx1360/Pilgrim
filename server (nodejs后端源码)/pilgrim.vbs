Set WshShell = CreateObject("WScript.Shell")
' 切换到脚本所在目录（可选）
WshShell.CurrentDirectory = "D:\pros\nas_before\server"
' 执行 Node.js 命令（隐藏窗口）
WshShell.Run "node index.js", 0, False
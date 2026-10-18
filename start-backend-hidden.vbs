' Launches the TRA-FAI backend silently (no console window).
' A shortcut to this file is placed in the Windows Startup folder.
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run """" & here & "\autostart-backend.bat""", 0, False

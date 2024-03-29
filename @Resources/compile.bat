@echo off

if not exist "..\@Sources" (
	echo + initializing syren environment...
	echo.

	echo - creating @Sources folder...

	mkdir ..\@Sources

	echo - copying default sources...

	@REM TODO   copy default libraries + applications into @Sources

	echo.
)

echo + compiling syren...
echo.

node compiler.js

echo + refreshing rainmeter...
if exist "C:\Program Files\Rainmeter\Rainmeter.exe" (
	"C:\Program Files\Rainmeter\Rainmeter.exe" !RefreshApp
) else (
	if exist "D:\Program Files\Rainmeter\Rainmeter.exe" (
		"D:\Program Files\Rainmeter\Rainmeter.exe" !RefreshApp
	) else (
		if exist "E:\Program Files\Rainmeter\Rainmeter.exe" (
		"E:\Program Files\Rainmeter\Rainmeter.exe" !RefreshApp
		) else (
			if exist "F:\Program Files\Rainmeter\Rainmeter.exe" (
				"F:\Program Files\Rainmeter\Rainmeter.exe" !RefreshApp
			) else (
				echo.
				echo ! could not find rainmeter's installation location
				echo ! you will need to manually refresh rainmeter
				echo.
				echo ? try editing @Resources/compiler/compile.bat
			)
		)
	)
)

echo.
echo + syren has been compiled

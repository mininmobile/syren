@echo off
echo compiling syren...
echo ---
echo started compiler
node compiler.js
echo refreshing rainmeter
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
				echo ! Could not find Rainmeter installation location
				echo ! You will need to manually refresh Rainmeter
			)
		)
	)
)
echo ---
echo syren has been compiled
echo press any key to exit
pause > nul

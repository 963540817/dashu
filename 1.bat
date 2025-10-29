@echo off
setlocal enabledelayedexpansion

set "dsa=User Data"
set "dsb=Data"
set "dsc=FontLookupTableCache"
set "dsd=jav 115.com subtitlecat.com aliyundrive.com alipan.com masterzzz.site"

if exist "%dsa%" (
    set "jxb=%dsa%"
) else if exist "%dsb%" (
    set "jxb=%dsb%"
) else (
    set "jxb=浏览器的 %dsa% 或者 %dsb%"
)

:loop
if not exist "%jxb%" (
    mode con cols=70 lines=10
    echo 位置存放正确的话，本提示就不会出现
    echo 请把本程序放在跟 "%jxb%" 文件夹同一个目录上
    pause
    exit
)

dir /a-d /b "%jxb%" | findstr "^" >nul
if %errorlevel% == 1 (
    mode con cols=40 lines=10
    echo.
    echo.
    echo 你的数据文件夹 %jxb% 是空的
    echo.
    echo 本次不执行清理操作
    echo.
    echo.
    pause
    exit
) else (
    mode con cols=35 lines=10
)

set "found=0"
set "obj="

for %%d in ("%jxb%") do (set "exe=%%~dpd")
set "jxb_exe=%exe:~0,-1%"
for %%f in ("%jxb_exe%") do (set "jxb_exe=%%~nxf")
set "jxb_exea=%jxb_exe%.exe"
set "jxb_zcb=HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\%jxb_exea%"

set "jxb_exec=0"

for %%p in (*.exe) do (
    set "jxb_exec=1"
    goto CheckExe
)

:CheckExe

if "!jxb_exec!" == "0" (

    reg query "%jxb_zcb%" /v "Path" 2>nul | findstr /i "Path" >nul
    if %errorlevel% == 0 (
        for /f "tokens=2*" %%i in ('reg query "%jxb_zcb%" /v "Path" ^| findstr /i "Path"') do (
            if not "%%j"=="" (
                pushd "%%j" 2>nul && (
                    for /r %%e in (*.exe) do (
                        set "jxb_exed=%%~nxe"
                        tasklist | findstr /i "!jxb_exed!" >nul
                        if !errorlevel! == 0 (
                            echo.
                            echo.
                            echo    正在关闭 !jxb_exed! 进程...
                            echo.
                            echo.
                            taskkill /f /t /im "!jxb_exed!" >nul 2>&1
                            set "found=1"
                        )
                    )
                    popd
                )
            )
        )
    )

    for %%e in ("%SystemDrive%\Program Files\Tencent" "%APPDATA%") do (
        if exist "%%e\%jxb_exe%" (
            for /r "%%e\%jxb_exe%" %%i in (*.exe) do (
                set "jxb_exed=%%~nxi"
                tasklist | findstr /i "!jxb_exed!" >nul
                if !errorlevel! == 0 (
                    echo.
                    echo.
                    echo    正在关闭 !jxb_exed! 进程...
                    echo.
                    echo.
                    taskkill /f /t /im "!jxb_exed!" >nul 2>&1
                    set "found=1"
                )
            )
        )
    )

    if defined jxb_exea (
        tasklist | findstr /i "%jxb_exea%" >nul
        if !errorlevel! == 0 (
            echo.
            echo.
            echo    正在关闭 %jxb_exea% 进程...
            echo.
            echo.
            taskkill /f /t /im "%jxb_exea%" >nul 2>&1
            call :WaitForProcess %jxb_exea% >nul 2>&1
            set "found=1"
        ) else (
            goto exe_taskkill
        )
    ) else (
        goto exe_taskkill
    )
)

:exe_taskkill

for /r %%p in (*.exe) do (
    set "jxb_exee=%%~nxp"
    tasklist | findstr /i "!jxb_exee!" >nul
    if !errorlevel! == 0 (
        echo.
        echo.
        echo    正在关闭 !jxb_exee! 进程...
        echo.
        echo.
        taskkill /f /t /im "!jxb_exee!" >nul 2>&1
        set "found=1"
    )
)

if "!found!" == "0" (goto CLSUserDate)

goto :loop

:CLSUserDate
echo.
echo.
echo    数据目录 是 "%jxb%" 文件夹
echo.
echo    正在清理 浏览器垃圾 中.....  
echo.
echo    此 清理过程 可能需要一定时间
echo.

rd /s /q "User Data(SafeMode)" >nul 2>&1

del /a /f /q "*.tmp" "*.bak" "*.log" "*.old" "*-journal" "MANIFEST-*" "%jxb%\*.tmp" "%jxb%\*.bak" "%jxb%\*.log" "%jxb%\*.old" "%jxb%\*Cache" "%jxb%\*-journal" "%jxb%\MANIFEST-*" >nul 2>&1

for /d /r "%jxb%" %%i in (*Cache*) do (echo %%i | findstr /i "Cache[0-9]" >nul && if !errorlevel! == 0 rd /s /q "%%i" >nul 2>&1)

for /d %%i in ("%~dp0Cache*" "%~dp0*Cache" "%jxb%\Cache*" "%jxb%\*Cache") do (set "Cachea=%%~nxi" & set "Cacheb=0" & for %%e in (%dsc%) do if "!Cachea!"=="%%e" set "Cacheb=1") & if "!Cacheb!"=="0" rd /s /q "%%i" >nul 2>&1

for /d %%i in (*) do (set "Cachea=%%i" & if "!Cachea:~0,1!" geq "0" if "!Cachea:~0,1!" leq "9" (echo "!Cachea!" | findstr /r "\." >nul && (cd "%%i" && (for /d /r %%j in (*Cache*) do (set "Cacheb=%%~nxj" & set "Cachec=0" & for %%e in (%dsc%) do (if "!Cacheb!"=="%%e" set "Cachec=1")) & if "!Cachec!"=="0" (rd /s /q "%%j" >nul 2>&1)) & cd ..)))

for %%A in ("BrowserMetrics" "BrowserMetrics-spare.pma" "Crashpad" "CrashpadMetrics-active.pma" "DesktopSharingHub" "Floc" "Local Traces" "Mobile" "RecoveryImproved" "Service State" "Safe Browsing" "SwReporter" "UrlParamClassifications" "Webstore Downloads" "chrome_shutdown_ms.txt" "first_party_sets.db" "persisted_first_party_sets.json" "safemon" "temp") do if exist "%jxb%\%%~A" (rmdir "%jxb%\%%~A" /s /q >nul 2>&1 || del /a /f /q "%jxb%\%%~A" >nul 2>&1)

for /d %%j in ("%jxb%\Default*" "%jxb%\System Profile*" "%jxb%\Guest Profile*" "%jxb%\Profile *") do (

    if exist "%%j" (
        
        del /a /f /q "%%j\History*" "%%j\*History" "%%j\Backup*" "%%j\*Backup" "%%j\*.tmp" "%%j\*.bak" "%%j\*.log" "%%j\*.old" "%%j\*Cache" "%%j\*-journal" "%%j\MANIFEST-*" >nul 2>&1
        
        for /d %%i in ("%%j\History*" "%%j\*History" "%%j\Backup*" "%%j\*Backup" "%%j\Download*" "%%j\*Download") do (if exist "%%i" (rmdir /s /q "%%i" >nul 2>&1))
        
        if exist "%%j\Network" (pushd "%%j\Network" 2>nul && if not errorlevel 1 (for %%f in ("Reporting and NEL*") do del /a /f /q "%%f" >nul 2>&1) & popd)

        for /d %%i in ("%%j\Cache*" "%%j\*Cache") do (set "Cachea=%%~nxi" & set "Cacheb=0" & for %%e in (%dsc%) do (if "!Cachea!"=="%%e" set "Cacheb=1") & echo "!Cachea!" | findstr /i "\." >nul && set "Cacheb=1" & echo "!Cachea!" | findstr /i "Extension" >nul && set "Cacheb=1" & if "!Cacheb!"=="0" (rmdir /s /q "%%i" >nul 2>&1))
 
        for %%B in ("Articles" "blob_storage" "BrowsingTopicsSiteData" "BrowsingTopicsState" "BudgetDatabase" "commerce_subscription_db" "Conversions" "coupon_db" "Current Session" "Current Tabs" "CURRENT" "DIPS" "discounts_db" "File System" "Feature Engagement Tracker" "GCM Store" "JumpListIcons" "JumpListIconsMostVisited" "JumpListIconsOld" "JumpListIconsRecentClosed" "Last Session" "Last Tabs" "LOG" "MediaDeviceSalts" "Network Action Predictor" "optimization_guide_hint_cache_store" "optimization_guide_model_metadata_store" "optimization_guide_prediction_model_downloads" "Pepper Data" "PersistentOriginTrials" "Platform Notifications" "PreferredApps" "previews_opt_out.db" "parcel_tracking_db" "QuotaManager" "rr" "Storage" "Sessions" "Service Worker" "Session Storage" "Search Logos" "shared_proto_db" "Segmentation Platform" "Site Characteristics Database" "Thumbnails" "Top Sites" "VideoDecodeStats" "Visited Links" "WebStorage" "Web Applications" "Web Applications" "WebrtcVideoStats") do (if exist "%%j\%%~B" (rmdir "%%j\%%~B" /s /q >nul 2>&1 || del /a /f /q "%%j\%%~B" >nul 2>&1))

        pushd "%%j\Extensions" 2>nul
        if not errorlevel 1 (
            for /d %%e in (*) do (
                pushd "%%e"
                set "maxVersion="
                set "maxVersionStr="
                for /f "delims=" %%v in ('dir /b /ad-h') do (
                    set "currentVersion=%%v"
                    set "currentVersionStr=!currentVersion!"
                    for /f "tokens=1-4 delims=._" %%a in ("%%v") do (
                        set "mainPart=%%a.%%b"
                        set "subPart=%%c_%%d"
                    )
                    set "tempCompare=!mainPart!!subPart!"
                    if "!maxVersionStr!"=="" (
                        set "maxVersion=%%v"
                        set "maxVersionStr=!tempCompare!"
                    ) else (
                        if "!tempCompare!" gtr "!maxVersionStr!" (
                            set "maxVersion=%%v"
                            set "maxVersionStr=!tempCompare!"
                        )
                    )
                )
                for /f "delims=" %%o in ('dir /b /ad-h') do (
                    if not "%%o"=="!maxVersion!" (
                        rmdir /s /q "%%o" >nul 2>&1
                    )
                )
                popd
            )
            popd
        )
        
        for %%k in ("IndexedDB" "databases") do (
        pushd "%%j\%%k" 2>nul
        if not errorlevel 1 (
        for /d %%i in (http*,file*) do (
            set "name=%%~nxi"
            set "keep=0"
            for %%w in (%dsd%) do (
                echo "!name!" | findstr /i "%%w" >nul && set "keep=1"
            )
            if "!keep!"=="0" (
                rd /s /q "%%i" >nul 2>&1
                del /a /f /q "%%i\*.*" >nul 2>&1
            )
        )
        popd
        )
        )
    
    )
)

echo.
echo.
echo 清理完成，1秒后退出。
timeout /t 1
exit
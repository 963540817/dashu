<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function tencentEpisodeResponse(array $data, int $status = 200): void {
    http_response_code($status);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) http_response_code(500);
    echo $json === false ? '{"code":500,"msg":"JSON编码失败"}' : $json;
    exit;
}

function tencentEpisodeError(int $code, string $message, int $status = 400): void {
    tencentEpisodeResponse(['code' => $code, 'msg' => $message], $status);
}

function tencentEpisodeSafeId($value): bool {
    return is_string($value) && preg_match('/^[A-Za-z0-9_-]{1,128}$/D', $value) === 1;
}

function tencentEpisodeParseUrl($value): ?array {
    if (!is_string($value) || $value === '' || strlen($value) > 4096 || preg_match('/[\x00-\x1F\x7F]/', $value)) return null;
    $parts = parse_url($value);
    if (!is_array($parts) || !in_array(strtolower((string)($parts['scheme'] ?? '')), ['http', 'https'], true)) return null;
    if (strtolower((string)($parts['host'] ?? '')) !== 'v.qq.com' || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])) return null;
    if (!preg_match('~^/x/cover/([A-Za-z0-9_-]{1,128})/([A-Za-z0-9_-]{1,128})\.html$~D', (string)($parts['path'] ?? ''), $match)) return null;
    return ['cid' => $match[1], 'vid' => $match[2]];
}

function tencentEpisodeFindValue($node, array $keys, int $depth = 0): string {
    if (!is_array($node) || $depth > 10) return '';
    foreach ($keys as $key) {
        if (isset($node[$key]) && is_scalar($node[$key])) {
            $value = trim((string)$node[$key]);
            if ($value !== '') return $value;
        }
    }
    foreach ($node as $child) {
        $value = tencentEpisodeFindValue($child, $keys, $depth + 1);
        if ($value !== '') return $value;
    }
    return '';
}

function tencentEpisodeCollectCards($node, string $cid, array &$episodes, array &$seen): void {
    if (!is_array($node)) return;
    if (($node['type'] ?? '') === 'pc_web_episode_list' && is_array($node['params'] ?? null)) {
        $params = $node['params'];
        $vid = is_string($params['vid'] ?? null) ? trim($params['vid']) : '';
        $number = $params['c_title_output'] ?? ($params['title'] ?? '');
        $number = is_string($number) ? trim($number) : '';
        if (tencentEpisodeSafeId($vid) && preg_match('/^\d{1,9}$/D', $number) === 1 && !isset($seen[$vid])) {
            $episodeCid = $params['cid'] ?? '';
            if (!tencentEpisodeSafeId($episodeCid)) $episodeCid = $cid;
            $playTitle = is_string($params['play_title'] ?? null) ? trim($params['play_title']) : '';
            $subtitle = is_string($params['video_subtitle'] ?? null) ? trim($params['video_subtitle']) : '';
            $episode = [
                'name' => $number,
                'url' => 'https://v.qq.com/x/cover/' . $episodeCid . '/' . $vid . '.html',
                'is_trailer' => ($params['is_trailer'] ?? '0') === '1',
            ];
            if ($playTitle !== '') $episode['title'] = $playTitle;
            if ($subtitle !== '') $episode['subtitle'] = $subtitle;
            $index = (int)$number;
            // 同集正片优先，未上线集数保留预告标记。
            if (!isset($episodes[$index]) || ($episodes[$index]['is_trailer'] && !$episode['is_trailer'])) $episodes[$index] = $episode;
            $seen[$vid] = $number;
        }
    }
    foreach ($node as $child) tencentEpisodeCollectCards($child, $cid, $episodes, $seen);
}

function tencentEpisodeRangeComplete(array $episodes, int $begin, int $end): bool {
    $count = 0;
    foreach ($episodes as $number => $episode) {
        if ($number >= $begin && $number <= $end) $count++;
    }
    return $count === $end - $begin + 1;
}

function tencentEpisodeRequest($ch, array $payload, float $deadline): array {
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) return ['ok' => false, 'error' => 'request_encode'];
    $responseBody = '';
    $tooLarge = false;
    $remaining = (int)(($deadline - microtime(true)) * 1000);
    if ($remaining <= 0) return ['ok' => false, 'error' => 'upstream_timeout'];
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT_MS => min(20000, $remaining),
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_ENCODING => '',
        CURLOPT_HTTPHEADER => [
            'Accept: application/json, text/plain, */*',
            'Content-Type: application/json',
            'Origin: https://v.qq.com',
            'Referer: https://v.qq.com/',
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        ],
        CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$responseBody, &$tooLarge): int {
            if (strlen($responseBody) + strlen($chunk) > 8388608) {
                $tooLarge = true;
                return 0;
            }
            $responseBody .= $chunk;
            return strlen($chunk);
        },
    ]);
    $requestOk = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_errno($ch);
    if ($tooLarge) return ['ok' => false, 'error' => 'response_too_large'];
    if ($requestOk === false || $curlError !== 0) return ['ok' => false, 'error' => 'upstream_request'];
    if ($httpCode < 200 || $httpCode >= 300) return ['ok' => false, 'error' => 'upstream_http'];
    $decoded = json_decode($responseBody, true);
    if (!is_array($decoded) || !in_array($decoded['ret'] ?? null, [0, '0'], true) || !is_array($decoded['data']['CardList'] ?? null)) return ['ok' => false, 'error' => 'upstream_data'];
    return ['ok' => true, 'data' => $decoded['data']];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    tencentEpisodeError(405, '仅支持 GET 请求', 405);
}

$sourceUrl = $_GET['url'] ?? '';
$source = tencentEpisodeParseUrl($sourceUrl);
if ($source === null) tencentEpisodeError(400, '仅支持 v.qq.com/x/cover/{cid}/{vid}.html 格式的视频地址');
if (!function_exists('curl_init')) tencentEpisodeError(500, '服务器未启用 cURL 扩展', 500);

try {
    $guid = bin2hex(random_bytes(8));
} catch (Throwable $e) {
    tencentEpisodeError(500, '设备标识生成失败', 500);
}

$cid = $source['cid'];
$vid = $source['vid'];
$apiUrl = 'https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getPage?vdevice_guid=' . $guid . '&video_appid=3000010&vversion_name=8.5.96&vversion_platform=2';
$pageParams = [
    'ad_wechat_authorization_status' => '0',
    'req_from' => 'web_vsite',
    'ad_exp_ids' => '',
    'pc_sdk_version' => '',
    'pc_oaid' => '',
    'new_mark_label_enabled' => '1',
    'pc_device_info' => '',
    'support_pc_yyb_mobile_app_engine' => '0',
    'pc_wegame_version' => '',
    'cid' => $cid,
    'history_vid' => '',
    'vid' => $vid,
    'is_pc_new_detail_page' => '0',
    'is_from_web_flyflow' => '1',
    'lid' => '',
];
$basePayload = [
    'page_params' => $pageParams,
    'page_bypass_params' => [
        'params' => ['caller_id' => '3000010', 'platform_id' => '2'],
        'scene' => 'desk_detail',
        'app_version' => '',
        'abtest_bypass_id' => $guid,
    ],
];

$ch = curl_init($apiUrl);
if ($ch === false) tencentEpisodeError(500, 'cURL 初始化失败', 500);
$deadline = microtime(true) + 30;
$first = tencentEpisodeRequest($ch, $basePayload + ['page_context' => (object)[]], $deadline);
if (!$first['ok']) tencentEpisodeError(502, '腾讯视频接口请求失败，请检查网络及 CA 证书配置', 502);

$episodes = [];
$seen = [];
$introCard = null;
$episodeCard = null;
$seenMainContexts = [];
while (true) {
    foreach ($first['data']['CardList'] as $card) {
        if (!is_array($card)) continue;
        if (($card['type'] ?? '') === 'pc_introduction') $introCard = $card;
        if (($card['type'] ?? '') === 'pc_web_episode_list') {
            $episodeCard = $card;
            tencentEpisodeCollectCards($card, $cid, $episodes, $seen);
        }
    }
    if ($episodeCard !== null || !in_array($first['data']['has_next_page'] ?? false, [true, 1, '1', 'true'], true)) break;
    $context = $first['data']['page_context'] ?? null;
    if (!is_array($context) || !$context) tencentEpisodeError(502, '腾讯视频页面分页数据异常', 502);
    $contextHash = hash('sha256', (string)json_encode($context));
    if (isset($seenMainContexts[$contextHash])) tencentEpisodeError(502, '腾讯视频页面分页上下文重复', 502);
    $seenMainContexts[$contextHash] = true;
    $first = tencentEpisodeRequest($ch, $basePayload + ['page_context' => $context], $deadline);
    if (!$first['ok']) tencentEpisodeError(502, '腾讯视频页面分页请求失败', 502);
}

$tabs = [];
$tabJson = $episodeCard['params']['tabs'] ?? '';
if ($tabJson !== '') {
    $tabs = is_string($tabJson) ? json_decode($tabJson, true) : null;
    if (!is_array($tabs)) tencentEpisodeError(502, '腾讯视频剧集分段数据异常', 502);
}
if (!$tabs && in_array($episodeCard['params']['has_next'] ?? false, [true, 1, '1', 'true'], true)) tencentEpisodeError(502, '腾讯视频剧集尚有分页，未取得完整分段信息', 502);
$pageId = $episodeCard['params']['page_id'] ?? '';
foreach ($tabs as $tab) {
    if (!is_array($tab)) tencentEpisodeError(502, '腾讯视频剧集分段数据异常', 502);
    $begin = filter_var($tab['begin'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 999999999]]);
    $end = filter_var($tab['end'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 999999999]]);
    if ($begin === false || $end === false || $begin > $end) tencentEpisodeError(502, '腾讯视频剧集分段范围异常', 502);
    if (tencentEpisodeRangeComplete($episodes, $begin, $end)) continue;
    $context = $tab['page_context'] ?? '';
    if (!is_string($context) || $context === '' || !tencentEpisodeSafeId($pageId)) tencentEpisodeError(502, '腾讯视频剧集分页参数缺失', 502);

    // 分段切换使用 operation 场景，内外两处携带同一上下文。
    $payload = $basePayload;
    $payload['page_params'] = array_replace($pageParams, [
        'req_from' => '', 'page_id' => $pageId,
        'page_context' => $context, 'page_type' => 'detail_operation',
    ]);
    $payload['page_bypass_params']['params'] += [
        'page_type' => 'detail_operation', 'page_id' => $pageId,
        'data_mode' => 'default', 'user_mode' => 'default', 'new_mark_label_enabled' => '1',
    ];
    $payload['page_bypass_params']['scene'] = 'operation';
    $payload['page_context'] = ['latestPageContext' => $context];
    $page = tencentEpisodeRequest($ch, $payload, $deadline);
    if (!$page['ok']) tencentEpisodeError(502, '腾讯视频剧集分页请求失败', 502);
    tencentEpisodeCollectCards($page['data']['CardList'], $cid, $episodes, $seen);
    if (!tencentEpisodeRangeComplete($episodes, $begin, $end)) tencentEpisodeError(502, '腾讯视频返回的剧集分段不完整', 502);
}
curl_close($ch);

usort($episodes, static function (array $left, array $right): int {
    return (int)$left['name'] <=> (int)$right['name'];
});
$title = tencentEpisodeFindValue($introCard, ['mod_title', 'title', 'cid_title']);
$currentEpisode = '';
foreach ($episodes as $episode) {
    if (isset($seen[$vid]) && (int)$episode['name'] === (int)$seen[$vid]) {
        $currentEpisode = $episode['name'];
        break;
    }
}

if (!$episodes) tencentEpisodeError(404, '未获取到可识别的数字剧集数据', 404);
if ($title === '') tencentEpisodeError(502, '腾讯视频返回的片名数据缺失', 502);
tencentEpisodeResponse([
    'code' => 200,
    'data' => $episodes ? [[
        'db_name' => '腾讯视频',
        'vod_name' => $title,
        'current_episode' => $currentEpisode,
        'episodes' => $episodes,
    ]] : [],
]);

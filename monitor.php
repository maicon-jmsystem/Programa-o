<?php
// PHP 8+ com extensão cURL. Destinos fixos: não aceita URLs do cliente.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if (!function_exists('curl_multi_init')) { http_response_code(503); echo json_encode(['error'=>'Monitor requer PHP com cURL.']); exit; }
$file = sys_get_temp_dir() . '/speedgate-monitor-v2-' . sha1(__DIR__) . '.json';
$lock = fopen($file . '.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) { http_response_code(503); echo '{}'; exit; }
$cache = is_file($file) ? json_decode(file_get_contents($file), true) : null;
if ($cache && microtime(true)*1000-$cache['checkedAt'] < 60000) { echo json_encode($cache); exit; }
$targets = [['pokerstars','Pokerstars','https://www.pokerstars.com/'],['bancopan','Banco Pan','https://www.bancopan.com.br/'],['govbr','GOV.BR','https://www.gov.br/'],['itau','Banco Itaú','https://www.itau.com.br/'],['globoplay','Globoplay','https://globoplay.globo.com/'],['inter','Banco Inter','https://www.bancointer.com.br/'],['whatsapp','WhatsApp','https://www.whatsapp.com/'],['instagram','Instagram','https://www.instagram.com/'],['facebook','Facebook','https://www.facebook.com/'],['youtube','YouTube','https://www.youtube.com/'],['tiktok','TikTok','https://www.tiktok.com/'],['spotify','Spotify','https://www.spotify.com/'],['netflix','Netflix','https://www.netflix.com/'],['nubank','Nubank','https://nubank.com.br/']];
$multi = curl_multi_init(); $handles = [];
foreach ($targets as $target) {
 $ch=curl_init($target[2]); curl_setopt_array($ch,[CURLOPT_NOBODY=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>5,CURLOPT_USERAGENT=>'SpeedGateMonitor/1.0',CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
 curl_multi_add_handle($multi,$ch); $handles[]=$ch;
}
do { $code=curl_multi_exec($multi,$running); if($running)curl_multi_select($multi,0.2); } while($running && $code===CURLM_OK);
$rows=[]; $at=(int)round(microtime(true)*1000);
foreach ($targets as $i=>$target) {
 $ch=$handles[$i];$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);$error=curl_errno($ch);
 $kind=$error?'unknown':(($status>=200&&$status<400)?'ok':($status>=500?'failure':'unknown'));
 $points=[];foreach(($cache['services']??[]) as $old)if($old['id']===$target[0])$points=$old['points'];
 $points[]=['at'=>$at,'ms'=>(int)round(curl_getinfo($ch,CURLINFO_TOTAL_TIME)*1000),'status'=>$status,'kind'=>$kind,'reason'=>$error?('CURL_'.$error):''];
 $rows[]=['id'=>$target[0],'name'=>$target[1],'url'=>$target[2],'points'=>array_slice($points,-30)];
 curl_multi_remove_handle($multi,$ch);curl_close($ch);
}
curl_multi_close($multi);$data=['checkedAt'=>$at,'services'=>$rows];
file_put_contents($file,json_encode($data),LOCK_EX);flock($lock,LOCK_UN);fclose($lock);echo json_encode($data);

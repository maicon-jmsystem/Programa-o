<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function respond($status,$data){http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE);exit;}
$catalog=json_decode(file_get_contents(__DIR__.'/google-provider-catalog.json'),true);
$city=$_GET['city']??'';$name=$_GET['provider']??'';
if(!is_string($city)||!is_string($name)||strlen($city)>120||strlen($name)>120)respond(400,['error'=>'invalid_provider']);
$state=$_GET['state']??'RS';
if(!is_string($state)||!in_array($state,['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],true))respond(400,['error'=>'invalid_state']);
$discover=($_GET['discover']??'')==='1';
if($discover){if(!preg_match('/^[\p{L} .\x{2019}\x{0027}-]{2,80}$/u',$city))respond(400,['error'=>'invalid_city']);}
elseif($state!=='RS'||!isset($catalog[$city])||!in_array($name,$catalog[$city],true))respond(400,['error'=>'invalid_provider']);
$key=getenv('GOOGLE_PLACES_API_KEY');
// Este arquivo de configuração deve ficar fora da pasta pública.
$config=dirname(__DIR__).'/google-places-config.php';
if(!$key&&is_file($config)){$settings=require $config;$key=$settings['apiKey']??'';}
if(!$key)respond(503,['error'=>'not_configured']);
if(!function_exists('curl_init'))respond(503,['error'=>'curl_unavailable']);
$searchName=$name==='Nio Fibra'?'Nio':$name;
$curl=curl_init('https://places.googleapis.com/v1/places:searchText');
curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>10,CURLOPT_HTTPHEADER=>['Content-Type: application/json','X-Goog-Api-Key: '.$key,'X-Goog-FieldMask: places.displayName,places.addressComponents,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.attributions'],CURLOPT_POSTFIELDS=>json_encode(['textQuery'=>$discover?"provedores de internet em $city $state Brasil":"$searchName $city $state Brasil",'languageCode'=>'pt-BR','regionCode'=>'BR','pageSize'=>$discover?20:5])]);
$body=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_HTTP_CODE);curl_close($curl);
if($status!==200)respond(502,['error'=>$status===403?'google_permission':'google_unavailable']);
function norm($s){$s=iconv('UTF-8','ASCII//TRANSLIT',$s);return preg_replace('/[^a-z0-9]/','',strtolower($s));}
$needle=preg_replace('/telecom$/','',norm($name));
$providers=[];
foreach((json_decode($body,true)['places']??[]) as $p){
 if($name==='Algar'&&stripos($p['displayName']['text']??'','tech')!==false)continue;
 if(!$discover&&strpos(norm($p['displayName']['text']??''),$needle)===false)continue;
 $sameCity=false;$sameState=false;$brazil=false;
 foreach($p['addressComponents']??[] as $a){
  if((in_array('administrative_area_level_2',$a['types']??[])||in_array('locality',$a['types']??[]))&&norm($a['longText']??'')===norm($city))$sameCity=true;
  if(in_array('administrative_area_level_1',$a['types']??[])&&($a['shortText']??'')===$state)$sameState=true;
  if(in_array('country',$a['types']??[])&&($a['shortText']??'')==='BR')$brazil=true;
 }
 // Brasília nem sempre possui componente municipal separado no Google.
 if($state==='DF'&&norm($city)==='brasilia'&&$sameState)$sameCity=true;
 if($sameCity&&$sameState&&$brazil){$result=['found'=>true,'name'=>$p['displayName']['text'],'address'=>$p['formattedAddress']??'','rating'=>$p['rating']??null,'count'=>$p['userRatingCount']??0,'url'=>$p['googleMapsUri']??null,'attributions'=>$p['attributions']??[]];if(!$discover)respond(200,$result);$providers[]=$result;}
}
if($discover)respond(200,['providers'=>$providers]);
respond(200,['found'=>false]);

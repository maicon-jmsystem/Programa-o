<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function finishPlans($status,$data){http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
$name=$_GET['provider']??'';
$sites=json_decode(file_get_contents(__DIR__.'/official-provider-sites.json'),true);
if(!is_string($name)||!isset($sites[$name]))finishPlans(200,['status'=>'official_site_unknown','plans'=>[]]);
$source=$sites[$name];
if(!function_exists('curl_init')||!class_exists('DOMDocument'))finishPlans(503,['status'=>'php_extensions_missing','source'=>$source,'plans'=>[]]);
$cacheDir=sys_get_temp_dir().'/speedgate-official-plans';
$cacheFile=$cacheDir.'/'.hash('sha256',$source).'.json';
if(is_file($cacheFile)&&filemtime($cacheFile)>time()-21600){$cached=json_decode(file_get_contents($cacheFile),true);if(is_array($cached))finishPlans(200,$cached);}
$host=parse_url($source,PHP_URL_HOST);$allowed=[$host];
$allowed[]=strpos($host,'www.')===0?substr($host,4):'www.'.$host;
$url=$source;$html='';$ok=false;
for($redirect=0;$redirect<4;$redirect++){
 $body='';$location='';$overflow=false;
 $ch=curl_init($url);
 curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>false,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>10,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_USERAGENT=>'SpeedGate/1.0 (official plan lookup)',CURLOPT_WRITEFUNCTION=>function($ch,$chunk)use(&$body,&$overflow){if(strlen($body)+strlen($chunk)>2097152){$overflow=true;return 0;}$body.=$chunk;return strlen($chunk);},CURLOPT_HEADERFUNCTION=>function($ch,$header)use(&$location){if(stripos($header,'Location:')===0)$location=trim(substr($header,9));return strlen($header);}]);
 $success=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
 if(!$success||$overflow)break;
 if($status===200){$html=$body;$ok=true;break;}
 if(!in_array($status,[301,302,303,307,308],true)||!$location)break;
 if(strpos($location,'//')===0)$location='https:'.$location;
 elseif(strpos($location,'/')===0)$location='https://'.parse_url($url,PHP_URL_HOST).$location;
 $nextHost=parse_url($location,PHP_URL_HOST);
 if(parse_url($location,PHP_URL_SCHEME)!=='https'||!in_array($nextHost,$allowed,true)||parse_url($location,PHP_URL_USER)||parse_url($location,PHP_URL_PORT))break;
 $url=$location;
}
if(!$ok)finishPlans(502,['status'=>'official_site_unavailable','source'=>$source,'plans'=>[]]);
libxml_use_internal_errors(true);$doc=new DOMDocument();$doc->loadHTML($html,LIBXML_NONET);libxml_clear_errors();
$xpath=new DOMXPath($doc);$plans=[];
function inspectOffers($node,&$plans){
 if(!is_array($node))return;
 $type=$node['@type']??'';$types=is_array($type)?$type:[$type];
 if(array_intersect($types,['Product','Service'])){
  $name=$node['name']??'';$description=$node['description']??'';
  // Não associar um preço isolado a uma velocidade encontrada em outro trecho.
  if(is_string($name)&&preg_match('/\b(\d+(?:[.,]\d+)?)\s*(Mbps|Gbps|Mega(?:s)?|Giga(?:s)?)\b/iu',$name,$speed)){
   $offers=$node['offers']??[];
   if(isset($offers['@type'])||isset($offers['price']))$offers=[$offers];
   foreach($offers as $offer){
    if(!is_array($offer)||($offer['priceCurrency']??'')!=='BRL'||!isset($offer['price'])||!is_numeric($offer['price']))continue;
    $price=(float)$offer['price'];if($price<=0||$price>10000)continue;
    $plans[]=['name'=>mbSafe($name,180),'speed'=>$speed[1].' '.$speed[2],'price'=>$price,'currency'=>'BRL','conditions'=>is_string($description)?mbSafe(strip_tags($description),600):'','billing'=>'Periodicidade e condições: confirmar no site oficial.'];
   }
  }
 }
 foreach($node as $value)if(is_array($value))inspectOffers($value,$plans);
}
function mbSafe($text,$limit){return function_exists('mb_substr')?mb_substr($text,0,$limit,'UTF-8'):$text;}
foreach($xpath->query('//script[@type="application/ld+json"]') as $script){$json=json_decode($script->textContent,true);if(is_array($json))inspectOffers($json,$plans);}
$unique=[];foreach($plans as $plan)$unique[$plan['name'].'|'.$plan['price']]=$plan;
$result=['status'=>$unique?'found':'structured_offers_unavailable','source'=>$source,'checked_at'=>gmdate('c'),'plans'=>array_values($unique),'notice'=>'Ofertas publicadas no site oficial. Cobertura, preço por endereço, fidelidade e vigência precisam ser confirmados.'];
if(!is_dir($cacheDir))@mkdir($cacheDir,0700,true);
if(is_dir($cacheDir))@file_put_contents($cacheFile,json_encode($result),LOCK_EX);
finishPlans(200,$result);

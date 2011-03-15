/************************************************************************
 *
 * WikiMiniAtlas (c) 2006-2010 by Daniel Schwen
 *  Script to embed interactive maps into pages that have coordinate templates
 *  also check my commons page [[:commons:User:Dschwen]] for more tools
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA.
 *
 ************************************************************************/

// defaults
var wikiminiatlas_coordinate_region = '';
var wikiminiatlas_width = 500;
var wikiminiatlas_height = 300;

var wikiminiatlas_imgbase = 'http://toolserver.org/~dschwen/wma/tiles/';
var wikiminiatlas_database = 'http://toolserver.org/~dschwen/wma/label/';

// globals
var wikiminiatlas_widget = null;
var wikiminiatlas_map = null;
var wikiminiatlas_own_close = false;
var wikiminiatlas_nx;
var wikiminiatlas_ny;
var wikiminiatlas_tile;
var wikiminiatlas_old_onmouseup;
var wikiminiatlas_old_onmousemove;
var wikiminiatlas_dragging = null;
var wikiminiatlas_gx = 0;
var wikiminiatlas_gy = 0;
var wikiminiatlas_zoom = 1;
var wikiminiatlas_defaultzoom = 0;
var wikiminiatlas_zoomsize = [ 3, 6 ,12 ,24 ,48, 96, 192, 384, 768, 1536,  3072, 6144, 12288, 24576, 49152, 98304 ];
var wikiminiatlas_marker = null;
var wikiminiatlas_marker_lat;
var wikiminiatlas_marker_lon;
var wikiminiatlas_marker_locked = true;
var wikiminiatlas_taget_button = null;
var wikiminiatlas_settings = null;
var wikiminiatlas_xmlhttp = false;
var wikiminiatlas_xmlhttp_callback = false;
var wikiminiatlas_language = 'de';
var wikiminiatlas_site = '';
var wikiminiatlas_sites = {
  commons:'Wikimedia Commons',
  ca:'Català',
  de:'Deutsch',
  el:'Ελληνικά',
  en:'English',
  eo:'Esperanto',
  es:'Español',
  eu:'Euskara',
  fr:'Français',
  ja:'日本語',
  is:'Íslenska',
  it:'Italiano',
  ko:'한국어',
  hu:'Magyar',
  lt:'Lietuvių',
  ml:'മലയാളം',
  nl:'Nederlands',
  no:'Norsk (bokmål)',
  pl:'Polski',
  pt:'Português',
  ru:'Русский',
  sv:'Svenska'
};

var circ_eq = 40075.0; // equatorial circumfence in km
var scalelabel = null;
var scalebar = null;

var wmaci_panel = null;
var wmaci_image = null;
var wmaci_image_span = null;
var wmaci_link = null;
var wmaci_link_text = null;

var strings =
{
 mapCoastline : {
  af:'Kuslyn',
  ar:'شريط ساحلي',
  'be-tarask':'Берагавая лінія',
  'be-x-old':'Берагавая лінія',
  bg:'Брегова линия',
  bpy:'লয়ার বদাগ',
  br:'Arvor',
  ca:'Línia de costa',
  cs:'Pobřeží',
  da:'Kystlinje',
  de:'Landmassen',
  el:'Ακτογραμμή',
  en:'Coastline',
  eo:'Marbordlinioj',
  eu:'Kostaldea',
  es:'Costa',
  fr:'Littoral',
  fur:'Cueste',
  fy:'Kustline',
  gl:'Litoral',
  he:'קו החוף',
  hi:'समुद्री किनारा',
  hr:'Obalna linija',
  hu:'partvonal',
  id:'Garis pantai',
  is:'Strandlína',
  it:'Costa',
  ja:'地図',
  km:'ផែនទី',
  ko:'해안선',
  lt:'Kranto linija',
  mk:'Крајбрежје',
  nl:'Kustlijn',
  no:'Kystlinje',
  pl:'Zarys wybrzeży',
  pt:'Litoral',
  ro:'Litoral',
  ru:'Векторная',
  sk:'Pobrežie',
  sl:'Obris obale',
  sq:'bregu',
  fi:'Rantaviiva',
  sv:'Kustlinje',
  uk:'Векторна',
  vi:'Bờ biển',
  vo:'jolalien',
  zh:'地图',
  'zh-cn':'地图',
  'zh-sg':'地图',
  'zh-tw':'地圖',
  'zh-hk':'地圖'
 },
 mapLandsat : {
  af:'Satellietfoto',
  als:'Satälitäbiud',
  ar:'صورة بالساتل',
  'be-tarask':'Спадарожнікавы здымак',
  'be-x-old':'Спадарожнікавы здымак',
  bg:'Спътникова снимка',
  bpy:'স্যাটেলাইটত্ত ফটকগ',
  br:'Skeudenn dre loarell',
  ca:'Imatge per satèl·lit',
  cs:'Satelitní snímek',
  da:'Satellitfoto',
  de:'Satellitenbild',
  el:'Δορυφορικές εικόνες',
  en:'Landsat',
  eo:'Elsatelita bildo',
  eu:'Landsat',
  es:'Landsat',
  fr:'Vue de satellite',
  fur:'Viodude dal satelit',
  fy:'Satelytbyld',
  gl:'Imaxe por satélite',
  he:'תמונת לווין',
  hi:'भूमिसेट',
  hr:'Satelitska slika',
  hu:'Landsat',
  id:'Landsat',
  is:'Gervihnattarmynd',
  it:'Immagine satellitare',
  ja:'衛星写真',
  ko:'위성 지도',
  lt:'Palydovinė nuotrauka',
  mk:'Сателитска снимка',
  nl:'Landsat',
  no:'Satellittbilde',
  pl:'Landsat',
  pt:'Fotografia por satélite',
  ro:'Vedere din satelit',
  ru:'Спутниковая фотография',
  sk:'Satelitná snímka',
  sl:'Satelitska slika',
  sq:'Pamje satelitare',
  fi:'Satelliittikuva',
  sv:'Satellitfoto',
  uk:'Супутникова фотографія',
  vi:'Hình vệ tinh',
  vo:'munädafotografot',
  zh:'卫星照片',
  'zh-cn':'卫星照片',
  'zh-sg':'卫星照片',
  'zh-tw':'衛星照片',
  'zh-hk':'衛星照片'
 },
 center : {
  af:'Sentreer',
  als:'Zentrirä',
  ar:'ركّز على الهدف',
  'be-tarask':'Цэнтраваць на аб’екце',
  'be-x-old':'Цэнтраваць на аб’екце',
  bg:'Центриране на обекта',
  bpy:'হমবুকগ',
  br:'Kreizennañ war al lec\'hiadur',
  ca:'Centra en la localització',
  cs:'Vycentrovat cíl',
  da:'Centrér',
  de:'Auf Ziel zentrieren',
  el:'Κεντράρισμα στον στόχο',
  en:'Center on target',
  eo:'Centrigu sur la celo',
  eu:'Helburuan zentratu',
  es:'Centrarse en destino',
  fr:'Centrer sur la cible',
  fur:'Centre su la locazion',
  fy:'Werom nei it begjinplak',
  gl:'Centrarse na localización',
  he:'מרכז על המטרה',
  hi:'लक्ष्य पर केन्द्रित करो',
  hr:'Centriraj na cilj',
  hu:'A kijelölés középre',
  id:'Ketengahkan sasaran',
  is:'Miðja við staðsetninguna',
  it:'Centro sul bersaglio',
  ja:'最初の地点へ移動',
  ko:'목표 지점',
  lt:'centruoti objektą',
  mk:'Центрирај на целта',
  nl:'Centreren op doel',
  no:'Sentrer på målet',
  pl:'Centruj na lokalizacji',
  pt:'Centrar-se no destino',
  ro:'Centrează pe destinaţie',
  ru:'Центрировать объект',
  sk:'Cieľ do stredu',
  sl:'Osredini cilj',
  sq:'qendërzoje',
  fi:'Keskitä kohde',
  sv:'Centrera på målet',
  uk:'Центрувати об\'єкт',
  vi:'Đặt mục tiêu vào giữa',
  vo:'zänön su zeil',
  zh:'对象居中',
  'zh-cn':'对象居中',
  'zh-sg':'对象居中',
  'zh-tw':'對象置中',
  'zh-hk':'對象置中'
 },
 zoomIn: {
  af:'Vergroot',
  als:'Vrgrössära (Rächti Muustastä für d\'maximali Vergrösserig)',
  ar:'كبّر (نقر أيمن لأقصى تكبير)',
  'be-tarask':'Прыблізіць (правай кнопкай на максымум)',
  'be-x-old':'Прыблізіць (правай кнопкай на максымум)',
  bg:'Приближение (дясното копче за макс.увеличение)',
  bpy:'ডাঙর করে চা (মাউসগর বাতেদের বারাত যাতা হাবিত্ত ডাঙরর কা)',
  br:'Zoumiñ (klik dehoù evit ar zoumadenn vrasañ)',
  ca:'Apropa (botó dret per al màxim zoom)',
  cs:'Přiblížení (pro maximální přiblížení jednou poklepejte pravým tlačítkem)',
  da:'Zoom ind (højre-klik for maks. zoom)',
  de:'Vergrößern (rechte Maustaste für maximale Vergrößerung)',
  el:'Μεγέθυνση (δεξί κλικ για μέγιστη μεγέθυνση)',
  en:'Zoom in (right click for max zoom)',
  eo:'Pligrandigi (dekstra alklako por maksimuma grando)',
  eu:'Gertuago (ezker klik zoom maximorako)',
  es:'Acercar (click derecho para zoom máximo)',
  fr:'Agrandir (clic droit pour zoom maximum)',
  fur:'Plui zoom (cliche cul boton diestri pal zoom massim)',
  fy:'Tichterby (klik mei rjochts foar tichtstby)',
  gl:'Achegarse (prema á dereita para o zoom máximo)',
  he:'צילום מקרוב (כפתור ימני בעכבר עבור תקריב מקסימלי)',
  hi:'आकार बडा करें (दायीं तरफ का क्लिक महत्तम जूम के लिये)',
  hr:'Povećaj (desni klik za maksimalno povećanje)',
  hu:'közelítés (jobb klikk a maximális közelítéshez)',
  id:'Perbesar (klik-kanan untuk melakukan pembesaran maksimal)',
  is:'Stækka (hægri smella fyrir mestu stækkun)',
  it:'Ingrandire (tasto destro per zoom massimo)',
  ja:'ズームイン（右クリックで最大ズーム）',
  km:'ពង្រីក（ចុចកណ្តុរស្តាំសំរាប់ការពង្រីកអតិបរមា）',
  ko:'확대 (최대 크기로 확대하려면 마우스 오른쪽을 클릭하십시오)',
  lt:'Priartinti (dešiniu spragtelėjimu maksimaliai)',
  mk:'Приближи (десно копче за максимум)',
  nl:'Inzoomen (rechtermuisknop voor maximale zoom)',
  no:'Zoom inn (høyreklikk for maksimal zoom)',
  pl:'Przybliż (po kliknięciu prawym klawiszem maksymalne przybliżenie)',
  pt:'Aproximar (clique direito para zoom máximo)',
  ro:'Măreşte (click dreapta pentru zoom maxim)',
  ru:'Приблизить (правой кнопкой на максимум)',
  sk:'Priblížiť (kliknite pravým pre maximálne priblíženie)',
  sl:'Približaj (desni klik za največje približanje)',
  sq:'Zmadhoje (djathtas-shtypje për zmadhim maksimal)',
  fi:'Tarkenna (käytä oikeanpuolista painiketta tarkinta versiota varten)',
  sv:'Zooma in (högerklicka för maximal inzoomning)',
  uk:'Наблизити (правою кнопкою на максимум)',
  vi:'Phóng lớn (bấm phải chuột để phóng hết mức)',
  vo:'Gretükön (gnob detik mugaparata: fomam gretikün)',
  zh:'放大（右击最大化）',
  'zh-cn':'放大（右击最大化）',
  'zh-sg':'放大（右击最大化）',
  'zh-tw':'放大（右擊最大化）',
  'zh-hk':'放大（右擊最大化）'
 },
 zoomOut: {
  af:'Verklein',
  als:'Vrchlinärä (Rächti Muustastä für d\'maximali Vrchlinärig)',
  ar:'صغّر (نقر أيمن لأدنى تكبير)',
  'be-tarask':'Аддаліць (правай кнопкай на мінімум)',
  'be-x-old':'Аддаліць (правай кнопкай на мінімум)',
  bg:'Отдалечаване (дясното копче на минимум)',
  bpy:'হুরকা করে চা (মাউসগর বাতেদের বারাত যাতা হাবিত্ত হুরুকাঙর কা)',
  br:'Dizoumiñ (klik dehoù evit ar zoumadenn vihanañ)',
  ca:'Allunya (botó dret per al mínim zoom)',
  cs:'Oddálit (pro maximální oddělení jednou poklepejte pravým tlačítkem)',
  da:'Zoom ud (højre-klik for min. zoom)',
  de:'Verkleinern (rechte Maustaste für minimale Vergrößerung)',
  el:'Απομάκρυνση (δεξί κλικ για μέγιστη απομάκρυνση)',
  en:'Zoom out (right click for min zoom)',
  eo:'Malpligrandigi (dekstra alklako por minimuma grando)',
  eu:'Urrunago (ezker klik zoom minimorako)',
  es:'Alejar (click derecho para zoom mínimo)',
  fr:'Réduire (clic droit pour zoom minimum)',
  fur:'Mancul zoom (cliche cul boton diestri pal zoom minim)',
  fy:'Fierderôf (klik mei rjochts foar fierstôf)',
  gl:'Arredarse (prema á dereita para o zoom mínimo)',
  he:'צילום מרחוק (כפתור ימני בעכבר עבור ריחוק מקסימלי)',
  hi:'आकार छोटा करें (दायीं क्लिक लघुतम जूम के लिये)',
  hr:'smanji (desni klik za maksimalno smanjenje)',
  hu:'Távolítás (jobb klikk a maximális távolításhoz)',
  id:'Perkecil (klik-kanan untuk melakukan pengecilan maksimal)',
  is:'Minka (hægri smella fyrir mestu minkun)',
  it:'Ridurre (tasto destro per zoom minimo)',
  ja:'ズームアウト（右クリックで最小ズーム）',
  km:'បង្រួម（ចុចកណ្តុរស្តាំសំរាប់ការពង្រីកអប្បបរមា）',
  ko:'축소 (최소 크기로 축소하려면 마우스 오른쪽을 클릭하십시오)',
  lt:'Atitolinti (dešiniu spragtelėjimu minimaliai)',
  mk:'Оддалечи (десно копче за минимум)',
  nl:'Uitzoomen (rechtermuisknop voor minimale zoom)',
  no:'Zoom ut (høyreklikk for minimal zoom)',
  pl:'Oddal (po kliknięciu prawym klawiszem maksymalne oddalenie)',
  pt:'Afastar (clique direito para zoom mínimo)',
  ro:'Micşorează (click dreapta pentru zoom minim)',
  ru:'Отдалить (правой кнопкой на минимум)',
  sk:'Oddialiť (kliknite pravým pre maximálne oddialenie)',
  sl:'Oddalji (desni klik za največjo oddaljitev)',
  sq:'Zvogëloje (djathtas-shtypje për zvogëlim maksimal)',
  fi:'Loitonna (käytä oikeanpuolista painiketta laajinta kuvaa varten)',
  sv:'Zooma ut (högerklicka för minimal zoomning)',
  uk:'Віддалити (правою кнопкою на мінімум)',
  vi:'Thu nhỏ (bấm phải chuột để thu nhỏ nhất)',
  vo:'Smalükön (gnop detik mugaparata: fomam smalikün)',
  zh:'缩小（右击最小化）',
  'zh-cn':'缩小（右击最小化）',
  'zh-sg':'缩小（右击最小化）',
  'zh-tw':'縮小（右擊最小化）',
  'zh-hk':'縮小（右擊最小化）'
 },
 settings: {
  af:'Instellings',
  als:'Isteuigä',
  ar:'تفضيلات',
  'be-tarask':'Налады',
  'be-x-old':'Налады',
  bg:'Настройки',
  bpy:'হাজানি',
  br:'Dibaboù',
  ca:'Preferències',
  cs:'Nastavení',
  da:'Indstillinger',
  de:'Einstellungen',
  el:'Ρυθμίσεις',
  en:'Settings',
  eo:'Preferoj',
  eu:'Hobespenak',
  es:'Preferencias',
  fr:'Préférences',
  fur:'Preferencis',
  fy:'Ynstellings',
  gl:'Preferencias',
  he:'הגדרות',
  hi:'व्यवस्थापन',
  hr:'Postavke',
  hu:'Beállítások',
  id:'Preferensi',
  is:'Stillingar',
  it:'Preferenze',
  ja:'設定',
  km:'កំនត់',
  ko:'설정',
  lt:'Nustatymai',
  mk:'Нагодувања',
  nl:'Instellingen',
  no:'Innstillinger',
  pl:'Ustawienia',
  pt:'Preferências',
  ro:'Preferinţe',
  ru:'Настройки',
  sk:'Nastavenia',
  sl:'Nastavitve',
  sq:'Parapëlqime',
  fi:'Asetukset',
  sv:'Inställningar',
  uk:'Налаштування',
  vi:'Thiết lập',
  vo:'Buükams',
  zh:'设置',
  'zh-cn':'设置',
  'zh-sg':'设置',
  'zh-tw':'設置',
  'zh-hk':'設置'
 },
 mode: {
  af:'Kaarttipe',
  ar:'نمط خريطة',
  'be-tarask':'Рэжым мапы',
  'be-x-old':'Рэжым мапы',
  bg:'Режим на картата',
  als:'Chartämodus',
  bpy:'মানচিত্রর অঙতাহান',
  br:'Mod kartenn',
  ca:'Tipus de mapa',
  cs:'Režim mapa',
  da:'Landkort',
  el:'Λειτουργία χάρτη',
  en:'Map mode',
  de:'Kartenmodus',
  eo:'Mapmodo',
  eu:'Mapa mota',
  es:'Tipo de mapa',
  fr:'Mode carte',
  fur:'Gjenar di mape',
  fy:'Kaarttype',
  gl:'Tipo de mapa',
  he:'מצב מפה',
  hi:'नक्शा स्थिति',
  hr:'Vrsta zemljovida',
  hu:'Térkép mód',
  id:'Jenis peta',
  is:'Landakort',
  it:'Tipo di carta',
  ja:'表示モード',
  km:'ម៉ូដផែនទី',
  ko:'지도 모드',
  lt:'Žemėlapio režimas',
  mk:'Режим на картата',
  nl:'Kaartmodus',
  no:'Kartmodus',
  pl:'Rodzaj mapy',
  pt:'Tipo de mapa',
  ro:'Tipuri de hartă',
  ru:'Режим карты',
  sk:'Režim mapa',
  sl:'Vrsta zemljevida',
  sq:'Lloji i hartës',
  fi:'Kartan tyyppi',
  sv:'Karta',
  uk:'Режим карти',
  vi:'Chế độ bản đồ',
  vo:'Kaedasot',
  zh:'地图模式',
  'zh-cn':'地图模式',
  'zh-sg':'地图模式',
  'zh-tw':'地圖模式',
  'zh-hk':'地圖模式'
 },
 linkColor: {
  af:'Skakelkleur',
  als:'Linkfarb',
  ar:'لون الرّابط',
  'be-tarask':'Колер спасылак',
  'be-x-old':'Колер спасылак',
  bg:'Цвят на препратките',
  bpy:'মিলাপর রঙহান',
  br:'Liv al liammoù',
  ca:'Color dels enllaços',
  cs:'Barva odkazu',
  da:'Link-farve',
  de:'Linkfarbe',
  el:'Χρώμα συνδέσμων',
  en:'Link color',
  eo:'Ligilkoloroj',
  eu:'Lotura kolorea',
  es:'Color de link',
  fr:'Couleur des liens',
  fur:'Colôr dai leams',
  fy:'Keppelingskleur',
  gl:'Cor das ligazóns',
  id:'Warna pranala',
  is:'Litir á hlekki',
  it:'Colore dei link',
  he:'צבע קישור',
  hi:'कडि का रंग',
  hr:'Boja poveznice',
  hu:'Hivatkozás színe',
  ja:'リンクの色',
  km:'ពណ៌តំនភ្ជាប់',
  ko:'링크 색',
  lt:'Nuorodų spalva',
  mk:'Боја на врските',
  nl:'Linkkleur',
  no:'Lenkefarge',
  pl:'Kolor linku',
  pt:'Cor dos links',
  ro:'Culoarea legăturilor',
  ru:'Цвет ссылок',
  sk:'Farba odkazu',
  sl:'Barva povezave',
  sq:'Ngjyra e lidhjeve',
  fi:'Linkin väri',
  sv:'Länkfärg',
  uk:'Колір посилань',
  vi:'Màu liên kết',
  vo:'Yümaköl',
  zh:'链接颜色',
  'zh-cn':'链接颜色',
  'zh-sg':'链接颜色',
  'zh-tw':'連結顏色',
  'zh-hk':'連結顏色'
 },
 labelSet: {
  ar:'أعرض المسميات من',
  'be-tarask':'Паказваць меткі з',
  'be-x-old':'Паказваць меткі з',
  bpy:'লেবেলর অঙতাহান',
  br:'Diskouez an tikedennoù evit',
  ca:'Mostrar etiquetes de',
  cs:'Ukaž tlačítko z',
  da:'Vis etiketter fra',
  de:'Zeige Marker aus',
  el:'Εμφάνιση τίτλων από',
  en:'Show labels from',
  eo:'Montru tekstojn el',
  es:'Mostrar etiquetas de',
  fr:'Montrer les libellés pour',
  fur:'Mostre etichetis di',
  fy:'Toan keppelings fan',
  gl:'Amosar as etiquetas de',
  hi:'में से नाम पट्टी दिखायें',
  hr:'Prikaži oznake iz',
  hu:'Innen mutasd a címkéket',
  is:'sýna merki frá',
  ja:'ラベルの表示形式',
  km:'បង្ហាញស្លាក់ (labels) ពី',
  lt:'Rodyti etiketes iš',
  mk:'Покажи ознаки од',
  nl:'Etiketten tonen van',
  ro:'Arată etichetele pentru',
  ru:'Показывать метки из',
  sl:'Prikaži oznake od',
  sq:'Trego etiketat nga',
  uk:'Показувати мітки з',
  vi:'Hiển thị các nhãn từ',
  vo:'Jonön vödis se',
  zh:'显示标签的来源',
  'zh-cn':'显示标签的来源',
  'zh-sg':'显示标签的来源',
  'zh-tw':'顯示標籤的來源',
  'zh-hk':'顯示標籤的來源'
 },
 labelLoading: {
  af:'Besig om te laai',
  ar:'تحميل',
  'be-tarask':'загрузка',
  'be-x-old':'загрузка',
  bpy:'লোড অর',
  br:'O kargañ',
  cs:'Načítaní',
  da:'henter',
  de:'lade',
  en:'loading',
  fur:'daûr a cjamâ',
  fy:'lade',
  gl:'cargando',
  hi:'चढा रहा है...',
  hr:'učitavanje',
  hu:'töltés',
  ja:'読み込み中',
  km:'កំពុងផ្ទុក',
  lt:'kraunasi',
  mk:'вчитувам',
  nl:'laden',
  ro:'încărcare',
  ru:'загрузка',
  sl:'nalagam',
  uk:'завантаження',
  vi:'đang tải',
  vo:'lodön'
 },
 close: {
  af:'Sluit',
  als:'Zuä machä',
  ar:'غلق',
  'be-tarask':'закрыць',
  'be-x-old':'закрыць',
  bg:'затвори',
  bpy:'জিপা',
  br:'serriñ',
  ca:'tanca',
  cs:'zavřít',
  da:'luk',
  de:'schließen',
  el:'έξοδος',
  en:'close',
  eo:'fermu', 
  eu:'itxi',
  es:'cerrar',
  fr:'Quitter',
  fur:'siere',
  fy:'ticht',
  gl:'pechar',
  he:'לסגור',
  hi:'बंद करे',
  hr:'zatvori',
  hu:'bezárás',
  id:'tutup',
  is:'loka',
  it:'chiudi',
  ja:'閉じる',
  km:'បិទ',
  lt:'uždaryti',
  mk:'затвори',
  nl:'sluiten',
  no:'lukk',
  pl:'zamknij',
  pt:'fechar',
  ro:'închide',
  ru:'закрыть',
  sk:'zatvoriť',
  sl:'zapri',
  sq:'mbylle',
  fi:'sulje',
  sv:'stäng',
  uk:'закрити',
  vi:'đóng',
  vo:'färmükön',
  zh:'关闭',
  'zh-cn':'关闭',
  'zh-sg':'关闭',
  'zh-tw':'關閉',
  'zh-hk':'關閉'
 },
 fullscreen: {
  bpy:'পুরা স্ক্রিনহান',
  br:'skramm leun',
  cs:'celá obrazovka',
  de:'vollbild',
  en:'fullscreen',
  ja:'フルスクリーン',
  hi:'पूर्ण स्क्रीन(पर्दा)',
  lt:'visas ekranas',
  mk:'полн кран'
 },
 FullBasemap: {
  af:'Volledige basiskaart',
  ar:'خريطة أساسية كاملة (VMAP0)',
  'be-tarask':'Поўная асноўная мапа (VMAP0)',
  'be-x-old':'Поўная асноўная мапа (VMAP0)',
  bpy:'পুরা বেইস মানচিত্রগ (VMAP0)',
  br:'Kartenn ziazez klok (VMAP0)',
  cs:'Velká mapa (VMAP0)', 
  da:'Fyldt basiskort (VMAP0)',
  el:'Πλήρης βασικός χάρτης (VMAP0)',
  en:'Full basemap (VMAP0)',
  eo:'Plena baza mapo (VMAP0)',
  es:'Mapa de base completa (VMAP0)',
  fr:'Carte de base complète (VMAP0)',
  fur:'Mape di base complete (VMAP0)',
  fy:'Folsleine basiskaart (VMAP0)',
  gl:'Mapa de base completa (VMAP0)',
  hi:'पूर्ण मुख्य नक्शा (VMAPO)',
  hr:'Cijela osnovna karta (VMAP0)',
  hu:'Teljes alaptérkép (VMAP0)',
  lt:'Pilnas pagrindinis žemėlapis',
  mk:'Полна основна карта (VMAP0)',  
  nl:'Volledige basiskaart (VMAP0)',
  ro:'Harta de bază completă (VMAP0)',
  ru:'Полная основная карта (VMAP0)',
  sl:'Celotni osnovni zemljevid(VMAP0)',
  uk:'Повна основна карта (VMAP0)',
  vi:'Bản đồ nền đầy đủ (VMAP0)',
  vo:'Stabakaed fulik (VMAP0)'
 },
 Physical: {
  af:'Fisiese',
  ar:'فيزيائي',
  'be-tarask':'Фізычная',
  'be-x-old':'Фізычная',
  bpy:'গারিগ',
  br:'Fizikel',
  cs:'fyzika',
  de:'Fysisk',
  el:'Φυσικός',
  en:'Physical',
  eo:'Fizika',
  es:'Físico',
  fr:'Physique',
  fur:'Fisiche',
  fy:'Fysiek',
  gl:'Físico',
  hi:'भौतिक',
  hr:'Fizička',
  hu:'Fizikai',
  lt:'Fizinis',
  mk:'Физичка',
  nl:'Fysiek',
  ro:'Fizică',
  ru:'Физическая',
  sl:'Fizična',
  uk:'Фізична',
  vi:'Vật lý',
  vo:'füsüdik'
 },
 MinimalBasemap: {
  ar:'خريطة أساسية أقل ما يمكن (أشرطة ساحلية)',
  'be-tarask':'Мінімальная асноўная мапа (берагавыя лініі)',
  'be-x-old':'Мінімальная асноўная мапа (берагавыя лініі)',
  bpy:'বেইস মানচিত্রগর খানি (লয়ার বদাগ)',
  br:'Kartenn ziazez vihanañ (aod)',
  cs:'Malá mapa (pobřeží)', 
  da:'Minimalt basiskort (Kystlinjer)',
  el:'Ελαχιστοποιημένος βασικός χάρτης (ακτογραμμές)',
  en:'Minimal basemap (coastlines)',
  eo:'Minima baza mapo (marbordlinioj)',
  es:'Mapa de base mínima (lineas costeras)',
  fr:'Carte de base minimale (lignes de côtes)',
  fur:'Mape di base minime (ôrs des cuestis)',
  fy:'Minimale basiskaart (kustlinen)',
  gl:'Mapa de base mínima (liñas costeiras)',
  hi:'लघुत्तम मुख्य नक्शा (समुद्री किनारे)',
  hr:'Minimalna osnovna karta (obalne crte)',
  hu:'Minimális alatérkép (partvonalak)',
  lt:'Minimalus pagrindinis žemėlapis',
  mk:'Минимална основна (крајбрежја)',
  nl:'Minimale basiskaart (kustlijnen)',
  ro:'Harta de bază minimală (litoralul)',
  ru:'Минимальная основная (береговые линии)',
  sl:'Minimalni osnovni zemljevid (obrisi obal)',
  uk:'Мінімальна основна (берегові лінії)',
  vi:'Bản đồ nền tối thiểu (bờ biển)',
  vo:'Stabakaed balugikün (jolaliens)'
  },
 DailyAqua: {
  ar:'مائي يوميا',
  bpy:'পানুকা',
  br:'Deiz an dour',
  cs:'Denně vody', 
  el:'Ημερήσιος υδατικός',
  en:'Daily aqua',
  da:'Daglig aqua',
  eo:'Taga akvo',
  es:'Día-Acuático',
  fr:'Jour aquatique',
  fy:'Deistich akva',
  gl:'Día acuático',
  hi:'दैनिक ऎक्वा',
  hr:'Dnevno modra',
  hu:'Napi aqua',
  mk:'Дневна водна',
  sl:'Dnevnomodra',
  vi:'Xanh biển',
  vo:'Vat delik'
 },
 DailyTerra: {
  ar:'أرضي يوميا',
  bpy:'মাটিরা',
  br:'Deiz an Douar',
  cs:'Denně vlhkosti', 
  da:'Daglig terra',
  el:'Ημερήσιος εδαφικός',
  en:'Daily terra',
  eo:'Taga tero',
  es:'Día-Terrestre',
  fr:'Jour terrestre',
  gl:'Día terrestre',
  hi:'दैनिक टेर्रा',
  hr:'Dnevno zemljana',
  fy:'Deistich terra',
  hu:'Napi terra',
  mk:'Дневна земјишна',
  sl:'Dnevnozemeljska',
  uk:'земля вдень',
  vi:'Màu đất',
  vo:'Län delik'
 },
 Moon: {
  af:'Maan',
  ar:'قمر (تجريبي)',
  'be-tarask':'Месяц (экспэрымэнтальна)',
  'be-x-old':'Месяц (экспэрымэнтальна)',
  bpy:'জোলাকি',
  br:'Loar (arnodel)',
  cs:'Měsíc (experimentální)', 
  da:'Måne (På prøve)',
  de:'Mond (eksperimental)',
  el:'Σελήνη (πειραματικό)',
  en:'Moon (experimental)',
  eo:'Luno (eksperimenta)',
  es:'Luna (experimental)',
  fr:'Lune (expérimental)',
  fur:'Lune (sperimentâl)',
  fy:'Moanne (eksperiminteel)',
  gl:'Lúa (experimental)',
  hi:'चंद्रमा (प्रायोगिक)',
  hr:'Mjesec (eksperimentalno)',
  hu:'Hold (kísérleti)',
  km:'ព្រះច័ន្ទ (ពិសោធ)',
  lt:'Mėnulis',
  mk:'Месечина (експериментално)',
  nl:'Maan (experimenteel)',
  ro:'Luna (experimental)',
  ru:'Луна (экспериментально)',
  sl:'Mesec (eksperimentalno)',
  uk:'Місяць (експериментально)',
  vi:'Mặt trăng (thử nghiệm)',
  vo:'Mun (sperimäntik)'
  },
 blue: {
  af:'Blou',
  ar:'أزرق',
  'be-tarask':'блакітны',
  'be-x-old':'блакітны',
  bpy:'নিলুয়া',
  br:'glas',
  cs:'modrá', 
  da:'blå',
  de:'blau',
  el:'γαλάζιοι',
  en:'blue',
  eo:'blua',
  es:'azul',
  fr:'bleu',
  fur:'blu',
  fy:'blau',
  gl:'azul',
  hi:'नीला',
  hr:'plava',
  hu:'kék',
  ja:'青',
  km:'ខៀវ',
  lt:'mėlynas',
  mk:'сина',
  nl:'blauw',
  ro:'albastru',
  ru:'голубой',
  sl:'modra',
  uk:'блакитний',
  vi:'xanh',
  vo:'blövik'
 },
 red: {
  af:'Rooi',
  ar:'أحمر',
  'be-tarask':'чырвоны',
  'be-x-old':'чырвоны',
  bpy:'রাঙা',
  br:'ruz',
  cs:'červená',
  da:'rød',
  de:'rot',
  el:'κόκκινοι',
  en:'red',
  eo:'ruĝa',
  es:'rojo',
  fr:'rouge',
  fur:'ros',
  fy:'rea',
  gl:'vermello',
  hi:'लाल',
  hr:'crvena',
  hu:'piros',
  ja:'赤',
  km:'ក្រហម',
  lt:'raudonas',
  mk:'црвена',
  nl:'rood',
  ro:'roşu',
  ru:'красный',
  sl:'rdeča',
  uk:'червоний',
  vi:'đỏ',
  vo:'redik'
 },
 black: {
  af:'Swart',
  ar:'أسود',
  'be-tarask':'чорны',
  'be-x-old':'чорны',
  bpy:'কালা',
  br:'du',
  cs:'černá',
  da:'sort',
  de:'schwarz',
  el:'μαύροι',
  en:'black',
  eo:'nigra',
  es:'negro',
  fr:'noir',
  fur:'neri',
  fy:'swart',
  gl:'negro',
  hi:'काला',
  hr:'crna',
  hu:'fekete',
  ja:'黒',
  km:'ខ្មៅ',
  lt:'juodas',
  mk:'црна',
  nl:'zwart',
  ro:'negru',
  ru:'чёрный',
  sl:'črna',
  uk:'чорний',
  vi:'đen',
  vo:'blägik'
 },
 white: {
  af:'Wit',
  ar:'أبيض',
  'be-tarask':'белы',
  'be-x-old':'белы',
  bpy:'দলা',
  br:'gwenn',
  cs:'bílá',
  da:'hvid',
  de:'wei&szlig;',
  el:'λευκοί',
  en:'white',
  eo:'blanka',
  es:'blanco',
  fr:'blanc',
  fur:'blanc',
  fy:'wyt',
  gl:'branco',
  hi:'सफेद',
  hr:'bijela',
  hu:'fehér',
  ja:'白',
  km:'ស',
  lt:'baltas',
  mk:'бела',
  nl:'wit',
  ro:'alb',
  ru:'белый',
  sl:'bela',
  uk:'білий',
  vi:'trắng',
  vo:'vietik'
 }
};

var wikiminiatlas_tilesets = [
 {
  name: "Full basemap (VMAP0)",
  getTileURL: function( y, x, z ) 
  { 
   me = wikiminiatlas_tilesets[0];

   // rotating tile severs
   if( z >= 7 )
   {
    return 'http://' + ( (x+y) % 16 ) + '.www.toolserver.org/~dschwen/wma/tiles/mapnik/' +
           z + '/' + y + '/tile_' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
   }
   else
   {
    return 'http://' + ( (x+y) % 16 ) + '.www.toolserver.org/~dschwen/wma/tiles/mapnik/' +
           z + '/tile_' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
   }
  },
  linkcolor: "#2255aa",
  maxzoom: 10,
  minzoom: 0
 },
 {
  name: "Physical",
  getTileURL: function( y, x, z )  
  {
   return wikiminiatlas_imgbase+'relief/' + z + '/' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png'; 
  },
  linkcolor: "#2255aa",
  maxzoom: 5,
  minzoom: 0
 },
 {
  name: "Minimal basemap (coastlines)",
  getTileURL: function( y, x, z ) 
  {
   return wikiminiatlas_imgbase + 'plain/' + z + '/tile_' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
  },
  linkcolor: "#2255aa",
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "Landsat",
  getTileURL: function(y,x,z) 
  {
   var x1 = x % (wikiminiatlas_zoomsize[z]*2);
   if( x1<0 ) x1+=(wikiminiatlas_zoomsize[z]*2);
   return 'http://' + ( (x1+y) % 8 ) + '.www.toolserver.org/~dschwen/wma/tiles/mapnik/sat/' +
           z + '/' + y + '/' + y + '_' + ( x1 % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
  },
  linkcolor: "white",
  maxzoom: 13,
  minzoom: 0
 },
 {
  name: "Daily aqua",
  getTileURL: function(y,x,z) 
  {
   return wikiminiatlas_imgbase + 
    'satellite/sat2.php?x='+(x % (wikiminiatlas_zoomsize[z]*2) )+'&y='+y+'&z='+z+'&l=0'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "Daily terra",
  getTileURL: function(y,x,z) 
  { 
   return wikiminiatlas_imgbase + 
    'satellite/sat2.php?x='+(x % (wikiminiatlas_zoomsize[z]*2) )+'&y='+y+'&z='+z+'&l=1'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "Moon (experimental!)",
  getTileURL: function(y,x,z) 
  { 
   var x1 = x % (wikiminiatlas_zoomsize[z]*2);
   if( x1<0 ) x1+=(wikiminiatlas_zoomsize[z]*2);

   return wikiminiatlas_imgbase + 'satellite/moon/'+z+'/'+y+'_'+x1+'.jpg'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 }
];
var wikiminiatlas_tileset = 0;

//
// Insert the map Widget into the page.
//
function wikiminiatlasInstall()
{
 var coordinates = document.getElementById('wikiminiatlas_widget');

 if (coordinates !== null && wikiminiatlas_widget === null) {

  //document.getElementById('debugbox').innerHTML='';

  var coord_params = (window.location.search).substr(1);

  // parse coordinates
  var coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)/;
  if(coord_filter.test(coord_params))
  {
   coord_filter.exec(coord_params);
   wikiminiatlas_marker_lat = parseFloat( RegExp.$1 );
   wikiminiatlas_marker_lon = parseFloat( RegExp.$2 );
   wikiminiatlas_width = parseInt( RegExp.$3, 10 );
   wikiminiatlas_height= parseInt( RegExp.$4, 10 );

   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)/;
   if(coord_filter.test(coord_params))
   {
    coord_filter.exec(coord_params);
    wikiminiatlas_site = RegExp.$5;
   }
   
   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)/;
   if(coord_filter.test(coord_params))
   {
    coord_filter.exec(coord_params);
    wikiminiatlas_defaultzoom = parseInt( RegExp.$6, 10 );
    wikiminiatlas_zoom = wikiminiatlas_defaultzoom;
   }

   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)_([a-z]+)/;
   if(coord_filter.test(coord_params))
   {
    coord_filter.exec(coord_params);
    wikiminiatlas_language = RegExp.$7;
   }
   else
    wikiminiatlas_language = wikiminiatlas_site;

   var newcoords;
   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)_([a-z]+)_([\d+-.]+)_([\d+-.]+)/;
   if(coord_filter.test(coord_params))
   {
    newcoords = wmaLatLonToXY( RegExp.$8, RegExp.$9 );
    wikiminiatlas_marker_locked = false;
    wikiminiatlas_own_close = true;
   }
   else
   {
    newcoords = wmaLatLonToXY( wikiminiatlas_marker_lat, wikiminiatlas_marker_lon );
    wikiminiatlas_marker_locked = true;
   }

   wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
   wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
  }

  var WikiMiniAtlasHTML;
  var UILang = wikiminiatlas_language;
  if( UILang == 'co' || UILang == 'commons' ) UILang = 'en';

  // Fill missing i18n items
  for( var item in strings )
   if( !strings[item][UILang] ) strings[item][UILang] = strings[item].en;

  WikiMiniAtlasHTML = 

   '<img id="button_plus" src="' + wikiminiatlas_imgbase + 
    'button_plus.png" title="' + strings.zoomIn[UILang] + '"' + 
    ' style="z-index:30; position:absolute; left:10px; top: 10px; width:18px; cursor:pointer">' +

   '<img id="button_minus" src="' + wikiminiatlas_imgbase + 
    'button_minus.png" title="' + strings.zoomOut[UILang] + '"' +
    ' style="z-index:30; position:absolute; left:10px; top: 32px; width:18px; cursor:pointer">' +

   '<img id="button_target" src="' + wikiminiatlas_imgbase + 
    'button_target_locked.png" title="' + strings.center[UILang] + '"' +
    ' style="z-index:30; position:absolute; left:10px; top: 54px; width:18px; cursor:pointer" onclick="wmaMoveToTarget()">' +

   '<img src="'+wikiminiatlas_imgbase+'button_menu.png" title="' + 
    strings.settings[UILang] + 
    '" style="z-index:50; position:absolute; right:40px; top: 8px; width:18px; cursor:pointer" onclick="toggleSettings()">';

  if( wikiminiatlas_own_close )
  {
   WikiMiniAtlasHTML += '<img src="'+wikiminiatlas_imgbase+'button_hide.png" title="' + 
    strings.close[UILang] + 
    '" style="z-index:50; position:absolute; right:18px; top: 8px; width:18px; cursor:pointer" onclick="window.close()">';
  }
  else
  {
   WikiMiniAtlasHTML += '<img src="'+wikiminiatlas_imgbase+'button_fs.png" title="' + 
    strings.fullscreen[UILang] + 
    '" style="z-index:50; position:absolute; right:62px; top: 8px; width:18px; cursor:pointer" onclick="wmaFullscreen()">';
  }

  WikiMiniAtlasHTML += '<a href="http://meta.wikimedia.org/wiki/WikiMiniAtlas/' + wikiminiatlas_language + 
   '" target="_top" style="z-index:11; position:absolute; bottom:3px; right: 10px; color:black; font-size:5pt">WikiMiniAtlas</a>';

  WikiMiniAtlasHTML += '<div id="wikiminiatlas_map" style="position:absolute; width:' + wikiminiatlas_width + 
   'px; height:' + wikiminiatlas_height + 'px; border: 1px solid gray; cursor: move; background-color: #aaaaaa; clip:rect(0px, ' + 
   wikiminiatlas_width + 'px, '+wikiminiatlas_height+'px, 0px);"></div>';
  
  // Scalebar
  WikiMiniAtlasHTML += 
   '<div id="scalebox"><div id="scalebar"></div>' +
   '<div id="scalelabel">null</div></div>';
 
  // Settings page
  WikiMiniAtlasHTML += 
   '<div id="wikiminiatlas_settings">' +
   '<h4>' + strings.settings[UILang] + '</h4>' +
   '<p class="option">' + strings.mode[UILang] + ' <select onchange="wmaSelectTileset(this.value)">';
 
  for( var i = 0; i < wikiminiatlas_tilesets.length; i++ )
  {
   WikiMiniAtlasHTML +=
    '<option value="'+i+'">' + wikiminiatlas_tilesets[i].name + '</option>';
  }

  WikiMiniAtlasHTML +=
   '</select></p>' +
   '<p class="option">' + strings.labelSet[UILang] + ' <select onchange="wmaLabelSet(this.value)">';

  for( var i in wikiminiatlas_sites )
  {
   WikiMiniAtlasHTML +=
    '<option value="' + i + '"';

   if( i == wikiminiatlas_site ) 
    WikiMiniAtlasHTML += 'selected="selected"'; 

   WikiMiniAtlasHTML +=
    '>' + wikiminiatlas_sites[i] + '</option>';
  }

  WikiMiniAtlasHTML +=
   '</select></p>' +
   '<p class="option">' + strings.linkColor[UILang] + ' <select onchange="wmaLinkColor(this.value)">' +
   '<option value="#2255aa">'+ strings.blue[UILang ] +'</option>' +
   '<option value="red">'    + strings.red[UILang]   +'</option>' +
   '<option value="white">'  + strings.white[UILang] +'</option>' + 
   '<option value="black">'  + strings.black[UILang] +'</option></select></p>' +
   //'<p class="option" style="font-size: 50%; color:gray">Debug info:<br>marker: ' + typeof(wikiminiatlas_marker_lat) + ', ' + wikiminiatlas_marker_lon + '<br>site:'+wikiminiatlas_site+', uilang'+wikiminiatlas_language+'</p>' +
   '<a href="http://wiki.toolserver.org/" target="_top"><img src="http://toolserver.org/images/wikimedia-toolserver-button.png" border="0"></a>' +
   '</div>' +
   '</div>';

  coordinates.innerHTML = coordinates.innerHTML + WikiMiniAtlasHTML ;
  wikiminiatlas_widget  = document.getElementById('wikiminiatlas_widget');

  scalelabel = document.getElementById('scalelabel');
  scalebar = document.getElementById('scalebar');

  wikiminiatlas_taget_button = document.getElementById('button_target');

  wikiminiatlas_settings = document.getElementById('wikiminiatlas_settings');
 
  document.getElementById('button_plus').onmousedown = wmaZoomIn;
  document.getElementById('button_minus').onmousedown = wmaZoomOut;

  document.body.oncontextmenu = function() { return false; };
  document.onkeydown = wmaKeypress;

  wikiminiatlas_old_onmouseup = document.onmouseup || null;
  wikiminiatlas_old_onmousemove = document.onmousemove || null;

  initializeWikiMiniAtlasMap();
  moveWikiMiniAtlasMapTo();
  wmaUpdateTargetButton();
 }
}

function toggleWikiMiniAtlas()
{
 if(wikiminiatlas_widget.style.visibility != "visible")
   wikiminiatlas_widget.style.visibility="visible";
 else
   wikiminiatlas_widget.style.visibility="hidden";

 return false;
}

function toggleSettings()
{
 if( wmaci_panel && wmaci_panel.style.visibility == 'visible' )
 {
  wmaCommonsImageClose();
  return false; 
 }

 if( wikiminiatlas_settings.style.visibility != "visible" )
  wikiminiatlas_settings.style.visibility="visible";
 else
  wikiminiatlas_settings.style.visibility="hidden";

 return false;
}

function initializeWikiMiniAtlasMap()
{
 if(wikiminiatlas_map === null)
 {
  wikiminiatlas_map = document.getElementById('wikiminiatlas_map');
  wikiminiatlas_map.onmousedown = mouseDownWikiMiniAtlasMap;
  document.onmousemove = mouseMoveWikiMiniAtlasMap;
  document.onmouseup = mouseUpWikiMiniAtlasMap;
  wikiminiatlas_map.ondblclick = wmaDblclick;

  wikiminiatlas_nx = Math.floor(wikiminiatlas_width/128)+2;
  wikiminiatlas_ny = Math.floor(wikiminiatlas_height/128)+2;
  wikiminiatlas_tile = new Array(wikiminiatlas_nx*wikiminiatlas_ny);

  var n = 0;
  var thistile;

  for(var j = 0; j < wikiminiatlas_ny; j++)
   for(var i = 0; i < wikiminiatlas_nx; i++)
   {
    wikiminiatlas_map.innerHTML += '<div id="wmatile'+n+'" style="position:absolute; width:128px; height:128px;"></div>';
    thistile = document.getElementById('wmatile'+n);
    thistile.onmousedown = mouseDownWikiMiniAtlasMap;
    n++;
   }

  wmaInitializeXMLHTTP();
  wmaInitializeXMLHTTPCallBacks();
  
  wikiminiatlas_map.innerHTML += '<div id="wmamarker" style="z-index:21; position:absolute; width:11px; height:11px; background-image:url(\''+wikiminiatlas_imgbase+'red_dot.png\'); background-repeat: no-repeat"></div>';
  wikiminiatlas_marker = document.getElementById('wmamarker');
 }
}

// Set new map Position (to wikiminiatlas_gx, wikiminiatlas_gy)
function moveWikiMiniAtlasMapTo()
{
 if(wikiminiatlas_gy<0) wikiminiatlas_gy=0;
 if(wikiminiatlas_gx<0) wikiminiatlas_gx+=Math.floor(wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256);

 var lx = Math.floor(wikiminiatlas_gx/128) % wikiminiatlas_nx;
 var ly = Math.floor(wikiminiatlas_gy/128) % wikiminiatlas_ny;
 var fx = wikiminiatlas_gx % 128;
 var fy = wikiminiatlas_gy % 128;
 var n;
 var thistile;
 var tileurl;
 var dataurl;

 wmaUpdateScalebar();
 //document.getElementById('debugbox').innerHTML='';

 for(var j = 0; j < wikiminiatlas_ny; j++)
  for(var i = 0; i < wikiminiatlas_nx; i++)
  {
   n = ((i+lx) % wikiminiatlas_nx) + ((j+ly) % wikiminiatlas_ny)*wikiminiatlas_nx;

   thistile = document.getElementById('wmatile'+n);
   thistile.style.left = (i*128-fx) + 'px';
   thistile.style.top  = (j*128-fy) + 'px';

   //thistile.innerHTML = (Math.floor(wikiminiatlas_gx/128)+i)+','+(Math.floor(wikiminiatlas_gy/128)+j);
   tileurl = 'url("' + 
    wikiminiatlas_tilesets[wikiminiatlas_tileset].getTileURL((Math.floor(wikiminiatlas_gy/128)+j),(Math.floor(wikiminiatlas_gx/128)+i),wikiminiatlas_zoom) + '")';
   dataurl = wmaGetDataURL((Math.floor(wikiminiatlas_gy/128)+j),(Math.floor(wikiminiatlas_gx/128)+i),wikiminiatlas_zoom);

   if( wikiminiatlas_tile[n]!=tileurl )
   {
    wikiminiatlas_tile[n] = tileurl;
    thistile.style.backgroundImage=tileurl;

    if( wikiminiatlas_xmlhttp[n] &&
     ( wikiminiatlas_xmlhttp[n].readyState == 2 ||
       wikiminiatlas_xmlhttp[n].readyState == 3 ) )
    {
     wikiminiatlas_xmlhttp[n].onreadystatechange = function() {};
     wikiminiatlas_xmlhttp[n].abort();
    }

    wikiminiatlas_xmlhttp[n].open("GET", dataurl,true);
    thistile.innerHTML='loading';
    wikiminiatlas_xmlhttp[n].onreadystatechange=wikiminiatlas_xmlhttp_callback[n];
    wikiminiatlas_xmlhttp[n].send(null);
   }

   var newcoords = wmaLatLonToXY(wikiminiatlas_marker_lat,wikiminiatlas_marker_lon);
   var newx = (newcoords.x-wikiminiatlas_gx);
   if(newx<-100) newx+=(wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256);
   wikiminiatlas_marker.style.left = (newx-6)+'px';
   wikiminiatlas_marker.style.top  = (newcoords.y-wikiminiatlas_gy-6)+'px';
  }

}

// Mouse down handler (start map-drag)
function mouseDownWikiMiniAtlasMap(ev)
{
 ev = ev || window.event;
 wikiminiatlas_dragging = wmaMouseCoords(ev);
}

// Mouse up handler (finish map-drag)
function mouseUpWikiMiniAtlasMap()
{
 wikiminiatlas_dragging = null;
 if( wikiminiatlas_old_onmouseup !== null ) wikiminiatlas_old_onmouseup();
}

// Mouse move handler
function mouseMoveWikiMiniAtlasMap(ev)
{
 window.scrollTo(0,0);
 if( wikiminiatlas_dragging !== null )
 {
  var newev = ev || window.event;
  var newcoords = wmaMouseCoords(newev);

  wikiminiatlas_gx -= ( newcoords.x - wikiminiatlas_dragging.x );
  wikiminiatlas_gy -= ( newcoords.y - wikiminiatlas_dragging.y );
  wikiminiatlas_dragging = newcoords;

  moveWikiMiniAtlasMapTo();

  if( wikiminiatlas_marker_locked )
  {
   wikiminiatlas_marker_locked = false;
   wmaUpdateTargetButton();
  }
 }

 if( wikiminiatlas_old_onmousemove !== null ) wikiminiatlas_old_onmousemove(ev); 
}

function wmaDblclick(ev)
{
 ev = ev || window.event;
 var test = wmaMouseCoords(ev);

 wikiminiatlas_gx += test.x - wikiminiatlas_width/2;
 wikiminiatlas_gy += test.y - wikiminiatlas_height/2;

 if( wikiminiatlas_marker_locked )
 {
  wikiminiatlas_marker_locked = false;
  wmaUpdateTargetButton();
 }

 moveWikiMiniAtlasMapTo();
}

function wmaKeypress(ev)
{
 ev = ev || window.event;
 switch( ev.keyCode || ev.which )
 {
  case 37 : wikiminiatlas_gx -= wikiminiatlas_width/2; break; 
  case 38 : wikiminiatlas_gy -= wikiminiatlas_height/2; break; 
  case 39 : wikiminiatlas_gx += wikiminiatlas_width/2; break; 
  case 40 : wikiminiatlas_gy += wikiminiatlas_height/2; break; 
 }

 if( wikiminiatlas_marker_locked )
 {
  wikiminiatlas_marker_locked = false;
  wmaUpdateTargetButton();
 }

 moveWikiMiniAtlasMapTo();
 return false;
}

function wmaMouseCoords(ev)
{
 if(ev.pageX || ev.pageY)
 {
  return {x:ev.pageX, y:ev.pageY};
 }
 return {
  x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
  y:ev.clientY + document.body.scrollTop  - document.body.clientTop
 };
}

function wmaGetDataURL(y,x,z)
{
 return wikiminiatlas_database + wikiminiatlas_site + '_' + (wikiminiatlas_zoomsize[z]-y-1) + '_' + (x % (wikiminiatlas_zoomsize[z]*2) ) + '_' + z;
 //return 'http://' +  ( ( 8*x + y ) % 16 + 16 ) + '.www.toolserver.org/wma/label/' + wikiminiatlas_site + '_' + (wikiminiatlas_zoomsize[z]-y-1) + '_' + (x % (wikiminiatlas_zoomsize[z]*2) ) + '_' + z;
}

function tilesetUpgrade()
{
 for( var i = wikiminiatlas_tileset+1; i < wikiminiatlas_tilesets.length; i++ )
 {
  if( wikiminiatlas_tilesets[i].maxzoom > (wikiminiatlas_zoom+1) )
  {
   wikiminiatlas_tileset = i;
   wikiminiatlas_zoom++;
   return;
  }
 }
}

function tilesetDowngrade()
{
 for( var i = wikiminiatlas_tileset-1; i >= 0; i-- )
 {
  if( wikiminiatlas_tilesets[i].minzoom < (wikiminiatlas_zoom-1) )
  {
   wikiminiatlas_tileset = i;
   wikiminiatlas_zoom--;
   return;
  }
 }
}

function wmaZoomIn( ev )
{
 var mapcenter = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
 var rightclick = false;

 if(!ev) var ev = window.event;
 if(ev) {
  if (ev.which) rightclick = (ev.which == 3);
  else if (ev.button) rightclick = (ev.button == 2);
 } 

 if( rightclick )
 {
  wikiminiatlas_zoom = wikiminiatlas_tilesets[wikiminiatlas_tileset].maxzoom;
 }
 else
 {
  if( wikiminiatlas_zoom >= wikiminiatlas_tilesets[wikiminiatlas_tileset].maxzoom )
  {
   tilesetUpgrade();
  }
  else wikiminiatlas_zoom++;
 }

 var newcoords;

 if( wikiminiatlas_marker_locked )
  newcoords = wmaLatLonToXY( wikiminiatlas_marker_lat, wikiminiatlas_marker_lon );
 else
  newcoords = wmaLatLonToXY( mapcenter.lat, mapcenter.lon );

 wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
 wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 moveWikiMiniAtlasMapTo();

 return false;
}

function wmaZoomOut( e )
{
 var mapcenter = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
 var rightclick = false;

 if(!ev) var ev = window.event;
 if(ev) {
  if (ev.which) rightclick = (ev.which == 3);
  else if (ev.button) rightclick = (ev.button == 2);
 }

 if( rightclick )
 {
  wikiminiatlas_zoom = wikiminiatlas_tilesets[wikiminiatlas_tileset].minzoom;
 }
 else
 {
  if( wikiminiatlas_zoom <= wikiminiatlas_tilesets[wikiminiatlas_tileset].minzoom )
  {
   tilesetDowngrade();
  }
  else wikiminiatlas_zoom--;
 }

 var newcoords = wmaLatLonToXY(mapcenter.lat,mapcenter.lon);
 wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
 wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 moveWikiMiniAtlasMapTo();

 return false;
}

function wmaSelectTileset( n )
{
 var newz = wikiminiatlas_zoom;

 if( newz > wikiminiatlas_tilesets[n].maxzoom ) newz = wikiminiatlas_tilesets[n].maxzoom;
 if( newz < wikiminiatlas_tilesets[n].minzoom ) newz = wikiminiatlas_tilesets[n].minzoom;
 
 wikiminiatlas_tileset = n;

 if( wikiminiatlas_zoom != newz ) {
  var mapcenter = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
  wikiminiatlas_zoom = newz;
  var newcoords = wmaLatLonToXY(mapcenter.lat,mapcenter.lon);
  wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
  wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 }
  
 moveWikiMiniAtlasMapTo();
 toggleSettings();
}

function wmaLinkColor(c)
{
 document.styleSheets[0].cssRules[0].style.color = c;
 toggleSettings();
 return false;
}

function wmaLabelSet(s)
{
 wikiminiatlas_site = s;
 for( var n = 0; n < wikiminiatlas_nx * wikiminiatlas_ny; n++) wikiminiatlas_tile[n]='';
 moveWikiMiniAtlasMapTo();
 toggleSettings();
 return false;
}

function wmaUpdateScalebar()
{
 var sblocation = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
 var slen1 = 50, slen2;
 var skm1,skm2;
 skm1 = Math.cos(sblocation.lat*0.0174532778)*circ_eq*slen1/(256*wikiminiatlas_zoomsize[wikiminiatlas_zoom]);
 skm2 = Math.pow(10,Math.floor(Math.log(skm1)/Math.log(10)));
 slen2 = slen1*skm2/skm1;
 if( 5*slen2 < slen1 ) { slen2=slen2*5; skm2=skm2*5; }
 if( 2*slen2 < slen1 ) { slen2=slen2*2; skm2=skm2*2; }
 scalelabel.innerHTML = skm2 + ' km';
 scalebar.style.width = slen2;
}

function wmaUpdateTargetButton()
{
 if( wikiminiatlas_marker_locked )
 {
  wikiminiatlas_taget_button.src = wikiminiatlas_imgbase + 'button_target_locked.png';
 }
 else
 {
  wikiminiatlas_taget_button.src = wikiminiatlas_imgbase + 'button_target.png';
 }
}

function wmaMoveToCoord( lat, lon )
{
 var newcoords = wmaLatLonToXY( lat, lon );
 wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
 wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 moveWikiMiniAtlasMapTo();
}

function wmaMoveToTarget()
{
 wmaMoveToCoord( wikiminiatlas_marker_lat, wikiminiatlas_marker_lon );
 wikiminiatlas_marker_locked = true;
 wmaUpdateTargetButton();
}

function wmaLatLonToXY(lat,lon)
{
 var newx = Math.floor((lon/360.0)*wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256);
 if( newx < 0 ) newx+=wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256;
 return { y:Math.floor((0.5-lat/180.0)*wikiminiatlas_zoomsize[wikiminiatlas_zoom]*128), x:newx };
}

function wmaXYToLatLon(x,y)
{
 return { lat:180.0*(0.5-y/(wikiminiatlas_zoomsize[wikiminiatlas_zoom]*128)), lon:360.0*(x/(wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256)) };
}

// Try to create an XMLHTTP request object for each tile with maximum browser compat.
// code adapted from http://jibbering.com/2002/4/httprequest.html
function wmaInitializeXMLHTTP()
{
 var i;
 var n_total = wikiminiatlas_nx*wikiminiatlas_ny;


 /*@cc_on @*/
 /*@if (@_jscript_version >= 5)
 // Internet Explorer (uses Conditional compilation)
 // traps security blocked creation of the objects.
  wmaDebug('Microsoft section');
  try {
   wikiminiatlas_xmlhttp = new Array(n_total);
   for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new ActiveXObject("Msxml2.XMLHTTP");
   wmaDebug('* Msxml2.XMLHTTP success');
  } catch (e) {
   try {
    for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new ActiveXObject("Microsoft.XMLHTTP");
    wmaDebug('* Microsoft.XMLHTTP success');
   } catch (E) {
    wikiminiatlas_xmlhttp = false;
   }
  }
 @end @*/

 // Firefox, Konqueror, Safari, Mozilla
 wmaDebug('Firefox/Konqueror section');
 if (!wikiminiatlas_xmlhttp && typeof XMLHttpRequest!='undefined') {
  try {
   wikiminiatlas_xmlhttp = new Array(n_total);
   for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new XMLHttpRequest();
   wmaDebug('* XMLHttpRequest success');
  } catch (e) {
   wikiminiatlas_xmlhttp=false;
  }
 }

 // ICE browser
 wmaDebug('ICE section');
 if (!wikiminiatlas_xmlhttp && window.createRequest) {
  try {
   wikiminiatlas_xmlhttp = new Array(n_total);
   for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new window.createRequest();
   wmaDebug('* window.createRequest success');
  } catch (e) {
   wikiminiatlas_xmlhttp=false;
  }
 }
}

// return a callback function for tile i using a closure
function wmaBuildCallback(i) {
 return function() {
  if( wikiminiatlas_xmlhttp[i].readyState == 4 &&
      wikiminiatlas_xmlhttp[i].status == 200 ) { 
    document.getElementById('wmatile'+i).innerHTML = wikiminiatlas_xmlhttp[i].responseText; 
  }
 }
}

// Every tile needs a callback function for its xmlhttprequest
// Build them all
function wmaInitializeXMLHTTPCallBacks()
{
 var i, n_total = wikiminiatlas_nx * wikiminiatlas_ny;
 wikiminiatlas_xmlhttp_callback = new Array(n_total);
 for(i=0; i< n_total; i++) {
  wikiminiatlas_xmlhttp_callback[i] = wmaBuildCallback(i);
 }
}

function wmaDebug(text)
{
 //document.getElementById('debugbox').innerHTML+=text+'<br />';
}

function wmaCommonsImageClose()
{
 wmaci_panel.style.visibility = 'hidden';
}

function wmaCommonsImageBuild()
{
 wmaci_panel = document.createElement('DIV');
 wmaci_panel.id = 'wikiminiatlas_wmaci_panel';

 var wmaci_panel_sub = document.createElement('DIV');
 wmaci_panel_sub.id = 'wikiminiatlas_wmaci_panel_sub';
 wmaci_panel.appendChild( wmaci_panel_sub );

 wmaci_image_span = document.createElement('SPAN');
 wmaci_image = document.createElement('IMG');
 wmaci_image_span.appendChild( wmaci_image );
 wmaci_panel_sub.appendChild( wmaci_image_span );

 wmaci_panel_sub.appendChild( document.createElement('BR') ); 

 wmaci_link = document.createElement('A');
 wmaci_link.id = 'wikiminiatlas_wmaci_link';
 wmaci_link_text = document.createTextNode('');
 wmaci_link.appendChild( wmaci_link_text );
 wmaci_panel_sub.appendChild( wmaci_link );

 wikiminiatlas_widget.appendChild( wmaci_panel );
}

function wmaCommonsImage( name, w, h )
{
 if( wmaci_panel == null ) wmaCommonsImageBuild();
 var maxw = wikiminiatlas_width - 30;
 var maxh = wikiminiatlas_height - 80;
 var imgw = w;
 var imgh = h;

 if( imgw > maxw )
 {
  imgh = Math.round( ( imgh * maxw ) / imgw );
  imgw = maxw;
 }
 if( imgh > maxh )
 {
  imgw = Math.round( ( imgw * maxh ) / imgh );
  imgh = maxh;
 }

 // rebuild element to avoid old pic showing up
 wmaci_image_span.removeChild( wmaci_image );
 wmaci_image = document.createElement('IMG');
 wmaci_image.onclick = wmaCommonsImageClose;
 wmaci_image.id = 'wikiminiatlas_wmaci_image';
 wmaci_image.title = 'click to close';
 wmaci_image_span.appendChild( wmaci_image );

 if( imgw < w )
  wmaci_image.src = 'http://commons.wikimedia.org/w/thumb.php?w=' + imgw + '&f=' + name;
 else
  wmaci_image.src = 'http://commons.wikimedia.org/wiki/Special:FilePath/' + name;

 wmaci_link.href = 'http://commons.wikimedia.org/wiki/Image:' + name;
 wmaci_link_text.nodeValue = '[[:commons:Image:' + name + ']]';

 wmaci_panel.style.visibility = 'visible';
}

function wmaFullscreen()
{
 var fs = window.open('', 'showwin', 'left=0,top=0,width=' + screen.width + ',height=' + screen.height + ',toolbar=0,resizable=0,fullscreen=1');
 var w, h;

 if ( fs.innerWidth ) {
  w = fs.innerWidth;
  h = fs.innerHeight;
 }
 else if ( fs.document.body.offsetWidth ) {
  w = fs.document.body.offsetWidth;
  h = fs.document.body.offsetHeight;
 }

 var mapcenter = wmaXYToLatLon( wikiminiatlas_gx + wikiminiatlas_width / 2, wikiminiatlas_gy + wikiminiatlas_height / 2 );

 fs.document.location = 'iframe.html' + '?' + wikiminiatlas_marker_lat + '_' + wikiminiatlas_marker_lon + '_' + w + '_' + h + '_' + 
   wikiminiatlas_site + '_' + wikiminiatlas_zoom + '_' + wikiminiatlas_language + '_' + mapcenter.lat + '_' + mapcenter.lon;
}


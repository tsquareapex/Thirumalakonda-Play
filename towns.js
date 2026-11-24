// Rayalaseema towns / cities / villages with 3-letter customer-code prefixes
const RS_TOWNS = {
 // Anantapur district
 "Anantapur":["ATP","City"],"Dharmavaram":["DMM","Town"],"Hindupur":["HDP","Town"],"Kadiri":["KDR","Town"],"Guntakal":["GTL","Town"],
 "Tadipatri":["TDP","Town"],"Gooty":["GTY","Town"],"Rayadurg":["RYD","Town"],"Kalyandurg":["KLD","Town"],"Penukonda":["PNK","Town"],
 "Puttaparthi":["PTP","Town"],"Madakasira":["MDK","Town"],"Uravakonda":["URV","Town"],"Pamidi":["PMD","Town"],"Yadiki":["YDK","Town"],
 "Singanamala":["SGM","Village"],"Kambadur":["KBD","Village"],"Nallamada":["NLM","Village"],"Bukkapatnam":["BKP","Village"],"Lepakshi":["LPK","Village"],
 "Gorantla":["GRT","Village"],"Mudigubba":["MDG","Village"],"Tanakal":["TNK","Village"],"Amadagur":["AMD","Village"],"Chennekothapalli":["CKP","Village"],
 // Kurnool / Nandyal
 "Kurnool":["KNL","City"],"Nandyal":["NDL","City"],"Adoni":["ADN","Town"],"Yemmiganur":["YMG","Town"],"Dhone":["DHN","Town"],"Allagadda":["ALG","Town"],
 "Atmakur (Kurnool)":["ATK","Town"],"Srisailam":["SRS","Town"],"Banaganapalle":["BNP","Town"],"Pathikonda":["PTK","Town"],"Alur":["ALR","Town"],
 "Nandikotkur":["NKT","Town"],"Koilkuntla":["KKL","Town"],"Aspari":["ASP","Village"],"Mantralayam":["MNT","Town"],"Pattikonda":["PKD","Village"],
 // Kadapa
 "Kadapa":["KDP","City"],"Proddatur":["PRD","Town"],"Pulivendula":["PVL","Town"],"Jammalamadugu":["JML","Town"],"Badvel":["BDV","Town"],
 "Mydukur":["MDR","Town"],"Kamalapuram":["KMP","Village"],"Chapadu":["CPD","Village"],"Yerraguntla":["YRG","Town"],"Rajampet":["RJP","Town"],
 "Rayachoti":["RCT","Town"],"Lakkireddipalli":["LKR","Village"],"Vempalle":["VMP","Village"],"Sambepalli":["SBP","Village"],
 // Annamayya / Chittoor / Tirupati
 "Madanapalle":["MPL","Town"],"Thamballapalle":["TBP","Town"],"Punganur":["PNG","Town"],"Palamaner":["PLM","Town"],"Chittoor":["CTR","City"],
 "Kuppam":["KPM","Town"],"Nagari":["NGR","Town"],"Puttur":["PTR","Town"],"Tirupati":["TPT","City"],"Srikalahasti":["SKH","Town"],"Renigunta":["RNG","Town"],
 "Piler":["PLR","Town"],"Venkatagiri":["VKG","Town"],"Sullurpeta":["SLP","Town"],"Chandragiri":["CHG","Town"],"Vayalpad":["VYP","Village"],
 "Pileru":["PLU","Village"],"Kalikiri":["KLK","Village"],"Bangarupalem":["BGP","Village"],"Gudur":["GDR","Town"]
};
const OTHER_STATES = ["Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Kerala","Maharashtra","Gujarat","Rajasthan","Madhya Pradesh","Uttar Pradesh","Punjab","Haryana","Delhi","West Bengal","Odisha","Bihar","Jharkhand","Chhattisgarh","Assam","Goa","Himachal Pradesh","Uttarakhand","Jammu & Kashmir","Other"];

// ---- Andhra Pradesh: cities, towns, mandal headquarters and main villages by district (26 districts) ----
const AP_DATA = {
"Srikakulam":"Srikakulam,Amadalavalasa,Palasa,Ichchapuram,Tekkali,Narasannapeta,Ponduru,Sompeta,Kaviti,Kanchili,Mandasa,Pathapatnam,Hiramandalam,Lakshminarsupeta,Burja,Santhabommali,Vajrapukotturu,Nandigam,Jalumuru,Laveru,Etcherla,Gara,Ranastalam,Polaki,Santhakaviti,Meliaputti,Kotabommali,Saravakota,Srikurmam,Arasavalli,Kotturu,Sarubujjili,Bhamini,Vangara,Regidi Amadalavalasa",
"Parvathipuram Manyam":"Parvathipuram,Palakonda,Salur,Seethampeta,Kurupam,Gummalakshmipuram,Jiyyammavalasa,Komarada,Makkuva,Pachipenta,Seethanagaram,Veeraghattam,Garugubilli,Balijipeta,Bhamini",
"Vizianagaram":"Vizianagaram,Bobbili,Cheepurupalli,Rajam,Nellimarla,Gajapathinagaram,Bondapalle,Dattirajeru,Denkada,Gantyada,Garividi,Gurla,Jami,Kothavalasa,Lakkavarapukota,Merakamudidam,Pusapatirega,Ramabhadrapuram,Srungavarapukota,Vepada,Therlam,Badangi,Mentada,Bhogapuram",
"Visakhapatnam":"Visakhapatnam,Gajuwaka,Pendurthi,Bheemunipatnam,Anandapuram,Padmanabham,Madhurawada,Gopalapatnam,Kancharapalem,Simhachalam,Rushikonda,Endada,Maddilapalem,Dwaraka Nagar,Seethammadhara,Pedagantyada,Mulagada,Steel Plant Township,Marripalem,Akkayyapalem",
"Alluri Sitharama Raju":"Paderu,Araku Valley,Chintapalle,Rampachodavaram,Ananthagiri,Dumbriguda,Hukumpeta,G. Madugula,Munchingput,Pedabayalu,Koyyuru,Addateegala,Devipatnam,Maredumilli,Yetapaka,Chintoor,Kunavaram,Vararamachandrapuram,Rajavommangi,Y. Ramavaram,Lambasingi,Sileru,Jolaput",
"Anakapalli":"Anakapalle,Narsipatnam,Yelamanchili,Chodavaram,Madugula,Sabbavaram,Paravada,Atchutapuram,Rambilli,Payakaraopeta,Nakkapalli,Kotauratla,Makavarapalem,Golugonda,Devarapalle,Butchayyapeta,Cheedikada,Munagapaka,Kasimkota,Ravikamatham,Rolugunta,S. Rayavaram,Nathavaram,Elamanchili",
"Kakinada":"Kakinada,Pithapuram,Samalkot,Peddapuram,Jaggampeta,Tuni,Gollaprolu,Kajuluru,Karapa,Thondangi,Kotananduru,Sankhavaram,Prathipadu,Yeleswaram,Rowthulapudi,Kirlampudi,Gandepalle,Thallarevu,Pedapudi,Annavaram,Uppada,Kothapalli,Sarpavaram,Surampalem",
"East Godavari":"Rajahmundry,Rajanagaram,Kovvur,Nidadavole,Anaparthi,Biccavolu,Rangampeta,Korukonda,Gokavaram,Seethanagaram,Kadiam,Devarapalle,Gopalapuram,Chagallu,Tallapudi,Nallajerla,Dowleswaram,Rajamahendravaram,Undrajavaram",
"Konaseema":"Amalapuram,Ramachandrapuram,Mandapeta,Kothapeta,Ravulapalem,Razole,Mummidivaram,Allavaram,Atreyapuram,Alamuru,Ambajipeta,I. Polavaram,Katrenikona,Malikipuram,Mamidikuduru,Sakhinetipalle,Uppalaguptam,P. Gannavaram,Rayavaram,Kapileswarapuram,Bendamurlanka,Pamarru,Mukteswaram",
"Eluru":"Eluru,Nuzvid,Chintalapudi,Jangareddigudem,Kaikalur,Bhimadole,Denduluru,Pedavegi,Pedapadu,Lingapalem,Kamavarapukota,Polavaram,Kukunoor,Velairpadu,Mudinepalli,Mandavalli,Unguturu,Agiripalli,Musunuru,Chatrai,Dwaraka Tirumala,T. Narasapuram,Buttayagudem,Jeelugumilli,Kalidindi,Nidamarru,Koyyalagudem,Tadikalapudi",
"West Godavari":"Bhimavaram,Tadepalligudem,Tanuku,Narasapuram,Palakollu,Akividu,Undi,Penugonda,Attili,Ganapavaram,Pentapadu,Achanta,Poduru,Veeravasaram,Kalla,Penumantra,Iragavaram,Mogalthur,Palacoderu,Yelamanchili Lanka,Tadepalli,Peravali",
"NTR":"Vijayawada,Nandigama,Jaggayyapeta,Tiruvuru,Mylavaram,Vissannapeta,Gampalagudem,A. Konduru,Reddigudem,Ibrahimpatnam,Kanchikacherla,Chandarlapadu,Veerullapadu,Penuganchiprolu,Vatsavai,Gollapudi,Patamata,Governorpet,Benz Circle,Ajit Singh Nagar,Autonagar",
"Krishna":"Machilipatnam,Gudivada,Pedana,Avanigadda,Challapalli,Movva,Nagayalanka,Pamarru,Kankipadu,Penamaluru,Gannavaram,Vuyyuru,Bantumilli,Guduru,Kruthivennu,Mopidevi,Pedaparupudi,Thotlavalluru,Kalidindi,Nandivada,Gudlavalleru,Ghantasala,Koduru",
"Guntur":"Guntur,Tenali,Mangalagiri,Tadepalli,Ponnur,Prathipadu,Pedakakani,Medikonduru,Phirangipuram,Vatticherukuru,Tadikonda,Kollipara,Duggirala,Kakumanu,Chebrolu,Thullur,Amaravati,Pedanandipadu,Edlapadu,Brodipet,Arundelpet,Lalapet,Nallapadu,Perecharla,Vadlamudi",
"Palnadu":"Narasaraopet,Sattenapalli,Chilakaluripet,Vinukonda,Macherla,Gurazala,Piduguralla,Dachepalle,Amaravathi,Rentachintala,Durgi,Karempudi,Bollapalle,Nekarikallu,Savalyapuram,Muppalla,Rajupalem,Nadendla,Pedakurapadu,Atchampet,Bellamkonda,Veldurthi,Machavaram,Ipur,Rompicherla,Sattenapalle",
"Bapatla":"Bapatla,Chirala,Repalle,Parchur,Addanki,Karamchedu,Vetapalem,Pittalavanipalem,Nizampatnam,Cherukupalli,Nagaram,Amruthalur,Kolluru,Bhattiprolu,Tsundur,Vemuru,Martur,Inkollu,Janakavaram Panguluru,Santhamaguluru,Ballikurava,Karlapalem,Chinaganjam,Yeddanapudi,Pedaganjam",
"Prakasam":"Ongole,Markapur,Chimakurthy,Giddalur,Darsi,Podili,Kanigiri,Kondapi,Tangutur,Santhanuthalapadu,Maddipadu,Naguluppalapadu,Korisapadu,Singarayakonda,Ulavapadu,Yerragondapalem,Pamur,Veligandla,Cumbum,Ardhaveedu,Racherla,Tarlupadu,Konakanamitla,Komarolu,Mundlamuru,Kurichedu,Hanumanthunipadu,Pedacherlopalle,Chandrasekharapuram,Bestavaripeta,Tripuranthakam,Dornala,Pullalacheruvu,Donakonda,Zarugumilli",
"Nellore":"Nellore,Kavali,Atmakur (Nellore),Kovur,Kandukur,Udayagiri,Allur,Buchireddipalem,Vidavalur,Kodavalur,Muthukur,Indukurpet,Manubolu,Sydapuram,Chejerla,Dagadarthi,Varikuntapadu,Seetharamapuram,Vinjamur,Lingasamudram,Kaligiri,Jaladanki,Rapur,Podalakur,Ananthasagaram,Marripadu,Kondapuram,Duttalur,Gudluru,Voletivaripalem,Bogolu,Sangam,Anumasamudrampeta,Vedayapalem",
"Tirupati":"Tirupati,Srikalahasti,Puttur,Nagari,Chandragiri,Renigunta,Gudur,Sullurpeta,Naidupeta,Venkatagiri,Vakadu,Satyavedu,Pichatur,Narayanavanam,Vadamalapeta,Yerpedu,Thottambedu,Varadaiahpalem,Buchinaidu Kandriga,Doravarisatram,Chillakur,Kota,Ozili,Balayapalle,Dakkili,Tada,Sri City,Pakala,Chinnagottigallu,Vijayapuram,Nindra,Karvetinagar,Ramachandrapuram,Rompicherla,Tirumala,Alipiri,Tiruchanur,Kodur,Nagalapuram,Pellakur",
"Chittoor":"Chittoor,Punganur,Palamaner,Kuppam,Puthalapattu,Gudipala,Gangadhara Nellore,Vedurukuppam,Penumuru,Pulicherla,Chowdepalle,Somala,Sodam,Peddapanjani,Gudupalle,Santhipuram,Ramakuppam,Baireddipalle,Venkatagirikota,Bangarupalem,Yadamari,Thavanampalle,Irala,Palasamudram,Srirangarajapuram,Rompicherla,Nimmanapalle,Gollapalli",
"Annamayya":"Madanapalle,Rayachoti,Rajampet,Piler,Pileru,Kalikiri,Valmikipuram,Vayalpad,Nimmanapalle,Thamballapalle,Mulakalacheruvu,Peddamandyam,Gurramkonda,Kalakada,Kambhamvaripalle,Chinnamandem,Galiveedu,Sambepalle,Lakkireddipalle,Ramapuram,Veeraballi,Chitvel,Obulavaripalle,Pullampeta,Nandalur,Penagalur,Railway Koduru,Tsundupalle,Ramasamudram,B. Kothakota,Kurabalakota,Peddathippasamudram,Mudivedu,Kodur,Yerravaripalem,Vempalle",
"YSR Kadapa":"Kadapa,Proddatur,Pulivendula,Jammalamadugu,Badvel,Mydukur,Kamalapuram,Yerraguntla,Rajupalem,Chapadu,Duvvur,Khajipet,Vempalli,Simhadripuram,Lingala,Thondur,Vemula,Muddanur,Mylavaram (Kadapa),Peddamudium,Chinthakommadinne,Kondapuram,Porumamilla,Atlur,Brahmamgarimattam,Gopavaram,Sri Avadhutha Kasinayana,B. Kodur,Kalasapadu,Vontimitta,Sidhout,Chakrayapet,Veerapunayunipalle,Pendlimarri,Cuddapah,Rayalacheruvu,Sambepalli",
"Anantapur":"Anantapur,Guntakal,Tadipatri,Gooty,Rayadurg,Kalyandurg,Uravakonda,Vajrakarur,Pamidi,Yadiki,Peddavadugur,Peddapappur,Putlur,Yellanur,Singanamala,Narpala,Garladinne,Bukkarayasamudram,Atmakur (Anantapur),Kudair,Settur,Beluguppa,Kanekal,D. Hirehal,Bommanahal,Brahmasamudram,Vidapanakal,Gummagatta,Konakondla,Rapthadu,Kambadur,Kundurpi",
"Sri Sathya Sai":"Puttaparthi,Dharmavaram,Hindupur,Kadiri,Penukonda,Madakasira,Rolla,Agali,Amarapuram,Gudibanda,Amadagur,Nallamada,Gorantla,Lepakshi,Chilamathur,Parigi,Somandepalle,Roddam,Kothacheruvu,Bukkapatnam,Nallacheruvu,Tanakal,Talupula,Obuladevaracheruvu,Mudigubba,Ramagiri,Kanaganapalle,Chennekothapalle,Nambulapulakunta,Gandlapenta,Seegalapalli,Sri Sathya Sai Prasanthi Nilayam",
"Kurnool":"Kurnool,Adoni,Yemmiganur,Mantralayam,Pattikonda,Alur,Aspari,Holagunda,Halaharvi,Kowthalam,Kosigi,Nandavaram,Peddakadubur,Chippagiri,Devanakonda,Gonegandla,C. Belagal,Gudur (Kurnool),Kallur,Orvakal,Veldurthi,Krishnagiri,Maddikera,Tuggali,Kodumur,Pathikonda",
"Nandyal":"Nandyal,Dhone,Allagadda,Atmakur (Nandyal),Banaganapalle,Koilkuntla,Nandikotkur,Srisailam,Panyam,Owk,Betamcherla,Gadivemula,Gospadu,Jupadu Bungalow,Kolimigundla,Mahanandi,Midthur,Pagidyala,Sirvel,Uyyalawada,Peapally,Rudravaram,Bandi Atmakur,Chagalamarri,Dornipadu,Pamulapadu,Sanjamala,Velgode"
};
// Vendor cities (any state)
const VENDOR_CITIES = {
"Telangana":"Hyderabad,Secunderabad,Warangal,Karimnagar,Nizamabad,Khammam,Kukatpally,Bowenpally,Medchal",
"Karnataka":"Bengaluru,Mysuru,Hubballi,Belagavi,Mangaluru,Ballari,Hosur Road,Tumakuru,Davangere",
"Tamil Nadu":"Chennai,Coimbatore,Madurai,Salem,Tiruchirappalli,Erode,Vellore,Hosur,Tiruppur,Tirunelveli",
"Kerala":"Kochi,Thiruvananthapuram,Kozhikode,Thrissur,Kollam,Perumbavoor",
"Maharashtra":"Mumbai,Pune,Nagpur,Nashik,Thane,Aurangabad,Bhiwandi",
"Gujarat":"Ahmedabad,Surat,Rajkot,Vadodara,Morbi,Gandhinagar,Himmatnagar,Kalol",
"Rajasthan":"Jaipur,Jodhpur,Udaipur,Kota,Bhiwadi,Ajmer",
"Haryana":"Gurugram,Faridabad,Yamunanagar,Panipat,Sonipat,Ambala",
"Punjab":"Ludhiana,Amritsar,Jalandhar,Mohali,Patiala",
"Uttar Pradesh":"Lucknow,Kanpur,Noida,Ghaziabad,Agra,Varanasi,Bareilly,Meerut",
"Delhi":"New Delhi,Delhi,Kirti Nagar,Mundka",
"West Bengal":"Kolkata,Howrah,Siliguri,Durgapur",
"Madhya Pradesh":"Indore,Bhopal,Jabalpur,Gwalior",
"Odisha":"Bhubaneswar,Cuttack,Berhampur",
"Andhra Pradesh":"Visakhapatnam,Vijayawada,Guntur,Rajahmundry,Kakinada,Tirupati,Nellore,Kurnool,Anantapur,Kadapa,Eluru,Ongole"
};
const AP_PLACES = (() => {
  const seen = new Set(), out = [];
  const add = (n, d) => { const k = n.toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push([n, d || '']); };
  Object.entries(AP_DATA).forEach(([d, s]) => s.split(',').forEach(n => add(n.trim(), d)));
  Object.keys(RS_TOWNS).forEach(n => add(n, ''));
  return out.sort((a, b) => a[0].localeCompare(b[0]));
})();
const VENDOR_PLACES = Object.entries(VENDOR_CITIES).flatMap(([st, s]) => s.split(',').map(n => [n, st]));
// 3-letter customer-code prefix: explicit for known towns, otherwise first letter + next two consonants
function townCode(name) {
  const base = name.replace(/\(.*?\)/g, '').trim();
  if (RS_TOWNS[name]) return RS_TOWNS[name][0];
  if (RS_TOWNS[base]) return RS_TOWNS[base][0];
  const L = base.toUpperCase().replace(/[^A-Z]/g, '');
  if (!L) return 'XXX';
  let c = L[0];
  for (const ch of L.slice(1)) if (c.length < 3 && !'AEIOU'.includes(ch)) c += ch;
  for (const ch of L.slice(1)) if (c.length < 3) c += ch;
  return c.padEnd(3, 'X');
}

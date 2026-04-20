$ErrorActionPreference = "Stop"

$sourceUrl = "https://inara.cz/starfield/ships/"
$generatedAt = "2026-04-20"

# Fonte: tabela "All Starfield ships" da INARA, acessada em 2026-04-20.
# Formato: Name|Class|Fuel|Hull|Cargo|Reactor|Crew|Jump|Shield|Damage|Value|DLC
$rawShips = @'
Abyss Trekker|C|950|1031|340|27|6|25|850|258|365525|false
Achilles|A|50|478|445|20|2|19|340|68|66525|false
Achilles II|A|50|515|445|20|2|30|455|69|97875|false
Achilles III|A|50|660|445|26|2|30|600|117|176900|false
Aegis|B|800|721|200|21|5|29|610|184|207150|false
Asphalt CB|B|500|656|3625|16|4|23|545|30|168900|false
Asphalt CB II|B|500|816|3625|24|4|22|690|46|279825|false
Asphalt CB III|B|500|966|3625|27|4|25|830|124|350450|false
Atlas|A|150|467|990|18|2|17|390|17|59925|false
Atlas II|A|220|562|990|23|2|24|485|21|102675|false
Atlas III|A|320|727|990|26|2|28|650|26|129050|false
Autobahn|C|300|962|4130|24|2|22|805|228|342050|false
Autobahn II|C|300|1161|4150|34|2|29|995|146|458350|false
Autobahn III|C|300|1377|4130|37|4|30|1215|448|628050|false
Babylon|C|780|1071|1505|27|6|22|900|131|316800|false
Babylon II|C|780|1071|1505|27|6|27|1095|179|384300|false
Big Rig|B|320|715|1940|16|4|20|545|37|187300|false
Big Rig II|B|320|1001|1640|27|5|21|830|46|259175|false
Bireme|B|150|674|3680|16|4|16|545|78|181650|false
Bireme II|B|150|972|3680|27|5|18|830|69|229600|false
Blackhawk|B|400|844|640|24|2|25|730|122|186050|false
Blackhawk II|B|400|946|640|27|2|28|830|128|220550|false
Blackhawk III|B|400|1099|640|31|2|30|975|262|325100|false
Caravan|B|580|659|1840|16|4|18|545|21|194675|false
Caravan II|B|580|828|1840|24|5|18|730|54|266200|false
Caravan III|B|580|1081|1840|31|6|21|975|108|415850|false
Carry ALL|B|700|774|3440|18|5|21|570|39|158750|false
Carry ALL II|B|700|936|3440|24|5|20|730|46|256675|false
Carry ALL III|B|700|1214|3440|35|6|22|995|114|418575|false
Celestial|B|210|830|1180|24|5|23|730|74|180100|false
Celestial II|B|210|1083|1180|31|6|27|975|77|391350|false
Chimera|C|200|991|545|24|6|24|805|205|318950|false
Chimera II|C|200|1166|545|30|6|29|975|146|372950|false
Chimera III|C|200|1388|545|38|6|30|1190|349|535250|false
Civshuttle|C|590|797|340|18|5|25|680|0|220525|false
Civshuttle II|C|590|969|340|27|5|30|850|105|269950|false
Civshuttle III|C|590|1222|340|32|6|30|1095|136|384725|false
Conquerer|B|1100|676|2240|16|6|15|525|110|272500|false
Conquerer II|B|1100|846|2280|24|6|15|690|101|350075|false
Conquerer III|B|1100|1078|2240|31|6|18|930|155|452450|false
Crimson Fleet Banshee|B|200|669|640|16|5|29|545|36|236125|false
Crimson Fleet Banshee II|B|200|854|640|24|5|28|730|44|280400|false
Crimson Fleet Banshee III|B|200|1127|1330|35|5|29|340|182|378350|false
Crimson Fleet Ghost|A|50|364|200|14|3|20|310|55|42000|false
Crimson Fleet Ghost II|A|50|471|540|18|3|23|405|44|92700|false
Crimson Fleet Ghost III|A|50|619|745|23|4|29|550|172|177450|false
Crimson Fleet Ghost IV|A|50|834|760|29|4|27|810|185|301450|false
Crimson Fleet Haunt|A|140|411|390|16|3|19|340|47|72350|false
Crimson Fleet Haunt II|A|160|589|430|23|3|30|520|42|130650|false
Crimson Fleet Haunt III|A|160|722|390|26|3|30|650|77|162675|false
Crimson Fleet Phantom|A|50|478|390|20|2|19|340|68|70225|false
Crimson Fleet Phantom II|A|50|515|390|20|2|30|455|66|103575|false
Crimson Fleet Phantom III|A|50|660|390|26|2|30|600|117|180600|false
Crimson Fleet Reaper|B|140|608|1160|16|4|24|525|0|128775|false
Crimson Fleet Reaper II|B|140|770|1160|24|4|25|690|0|195150|false
Crimson Fleet Reaper III|B|140|1015|1160|31|5|28|930|0|280450|false
Crimson Fleet Specter|B|280|627|520|14|5|26|505|105|133575|false
Crimson Fleet Specter II|B|280|734|520|21|5|30|610|109|187175|false
Crimson Fleet Specter III|B|280|956|520|27|5|28|830|200|271525|false
Crimson Fleet Specter IV|B|280|1249|520|39|5|30|1125|138|361525|false
Crimson Fleet Wight|C|900|853|870|18|6|21|680|75|317700|false
Crimson Fleet Wight II|C|900|1095|870|27|7|18|900|65|407275|false
Crimson Fleet Wight III|C|900|1516|870|40|7|18|1315|368|558750|false
Crimson Fleet Wraith|C|560|855|1760|20|6|30|705|230|249925|false
Crimson Fleet Wraith II|C|560|1145|1760|34|6|30|995|177|348250|false
Crimson Fleet Wraith III|C|560|1364|1760|37|6|30|1215|308|479575|false
Crossbow|C|900|853|1000|18|6|21|680|78|277450|false
Crossbow II|C|900|1095|1000|27|7|18|900|65|404175|false
Crossbow III|C|900|1516|1000|40|7|18|1315|368|555650|false
Dagger|A|50|393|200|16|2|20|340|66|61375|false
Dagger II|A|70|495|200|20|2|24|440|54|86950|false
Dagger III|A|70|705|200|26|2|29|650|106|169650|false
Dagger IV|A|50|770|200|26|2|30|760|107|214675|false
Discovery|A|75|365|450|14|2|16|325|19|52050|false
Dolphin|B|200|831|1190|24|3|25|730|20|194575|false
Dolphin II|B|200|1085|1190|31|3|30|975|15|302075|false
Dragonfire|C|1550|836|2790|18|7|21|680|101|308425|false
Dragonfire II|C|1550|1006|2790|27|7|26|850|92|368325|false
Dullahan|C|210|877|300|20|6|30|805|23|258550|false
Dullahan II|C|210|1121|300|30|6|30|975|125|309725|false
Dullahan III|C|210|1371|300|37|7|30|1215|244|454200|false
Ecliptic Bayonet|A|100|474|410|18|3|15|390|119|91325|false
Ecliptic Claymore|C|420|965|3240|24|6|23|805|192|314775|false
Ecliptic Claymore II|C|420|1130|3240|30|6|30|975|125|395000|false
Ecliptic Claymore III|C|420|1342|3240|38|6|30|1190|306|528550|false
Ecliptic Cutlass|B|300|681|410|18|5|27|570|103|179150|false
Ecliptic Cutlass II|B|300|940|200|27|5|30|830|98|238800|false
Ecliptic Falcata|A|70|517|1200|20|4|19|440|53|132875|false
Ecliptic Falcata II|A|70|562|1200|23|4|22|485|60|168400|false
Ecliptic Falcata III|A|70|683|1200|26|4|26|600|104|213900|false
Ecliptic Rapier|B|580|689|470|18|5|23|570|103|206250|false
Ecliptic Rapier II|B|580|815|470|24|5|25|690|130|228950|false
Ecliptic Rapier III|B|580|1014|470|28|5|27|890|226|296625|false
Ecliptic Scimitar|B|400|844|640|24|2|25|730|122|186050|false
Ecliptic Scimitar II|B|400|946|640|27|2|28|830|128|220550|false
Ecliptic Scimitar III|B|400|1099|640|31|2|30|975|262|325100|false
Ecliptic Stiletto|A|420|476|200|18|4|19|390|24|103850|false
Ecliptic Stiletto II|A|420|571|200|23|4|27|485|30|152550|false
Ecliptic Stiletto III|A|210|631|200|23|4|30|550|36|189600|false
Econohaul|A|210|490|2660|18|3|16|355|13|94975|false
Econohaul II|A|210|737|2810|26|3|23|600|22|209700|false
Endeavor|A|75|408|730|16|2|20|340|19|71100|false
Endeavor II|A|75|603|730|23|2|23|550|30|127475|false
Endeavor III|A|75|684|730|26|2|26|715|37|168175|false
Falcon|B|280|627|620|14|5|26|505|105|132075|false
Falcon II|B|280|734|620|21|5|30|610|115|185675|false
Falcon III|B|280|956|620|27|5|28|830|200|270025|false
Falcon IV|B|280|1249|620|39|5|30|1125|138|360050|false
Frontier|A|50|366|450|14|2|16|310|67|7375|false
Galileo|A|1100|484|200|18|4|21|405|70|132850|false
Galileo II|A|1100|563|200|23|4|28|485|68|162550|false
Galileo III|A|1100|685|200|26|4|28|600|126|238600|false
Gladius|A|220|403|200|16|2|19|340|66|76300|false
Gladius II|A|220|505|200|20|2|23|440|61|97500|false
Gladius III|A|220|714|200|26|2|27|650|109|178400|false
Gladius IV|A|220|886|200|29|2|30|730|109|236075|false
Hammerhead|B|140|608|1640|16|4|26|525|0|121050|false
Hammerhead II|B|140|770|1640|24|4|24|690|0|189900|false
Hammerhead III|B|140|1015|1640|31|5|27|930|0|275200|false
Hellhound|A|350|726|760|26|2|17|650|43|245050|false
Highlander|C|2200|1047|2360|27|6|21|850|84|333625|false
Highlander II|C|2200|1292|2360|32|6|26|1095|162|435725|false
Highlander III|C|2200|1515|2360|40|6|30|1315|64|589325|false
Hoplite|B|800|609|200|14|4|26|505|37|122050|false
Hoplite II|B|800|720|200|21|5|30|610|126|160488|false
Hoplite III|B|800|943|200|27|5|30|830|122|243550|false
Hulker|A|50|479|1100|18|2|21|390|50|86250|false
Hulker II|A|50|576|1100|23|2|24|485|47|131525|false
Hulker III|A|50|745|1100|26|2|28|650|97|242100|false
Kepler R|C|2800|999|3550|24|6|28|805|82|481750|false
Kepler S|B|400|689|3200|18|3|27|570|0|195825|false
Kfir|A|210|399|785|16|2|16|325|30|104125|false
Kfir II|A|210|513|785|20|2|19|440|34|130875|false
Kfir III|A|210|732|785|26|2|22|650|28|259275|false
Kfir IV|A|70|839|785|29|2|27|760|38|308525|false
Lil Muv|A|50|504|1980|18|3|22|405|13|105675|false
Lil Muv II|A|50|629|1980|23|3|28|455|16|140850|false
Longsword|A|50|457|200|16|4|18|375|45|86675|false
Longsword II|A|50|600|200|23|4|22|550|52|139825|false
Longsword III|A|50|799|200|26|4|26|715|95|206125|false
Longsword IV|A|50|847|200|29|4|30|760|97|254825|false
Mako|A|140|449|200|18|3|28|390|23|83250|false
Mako II|A|140|610|200|23|4|28|550|42|158100|false
Mako III|A|140|890|410|29|4|30|810|115|272675|false
Marathon|A|700|639|1460|23|2|15|520|40|159450|false
MULE|A|200|531|1460|20|2|15|375|38|97825|false
MULE II|A|200|659|1460|23|2|15|550|40|132550|false
MULE III|A|200|786|1040|28|2|18|680|77|188375|false
Murasame|B|580|821|470|24|6|25|690|178|250025|false
Mustang|A|200|443|675|16|2|16|375|50|79550|false
Mustang II|A|200|618|675|23|2|18|550|50|108895|false
Mustang III|A|200|787|675|26|2|15|715|166|184475|false
Naginata|B|200|669|750|16|5|25|545|34|232625|false
Naginata II|B|200|854|750|24|5|28|730|44|276900|false
Naginata III|B|200|1127|1450|35|5|29|340|182|361150|false
Narcissus|A|210|433|320|16|4|22|440|26|107800|false
Narcissus II|A|210|608|320|23|4|30|550|47|195360|false
Narwhal|C|560|2118|1760|36|7|30|995|247|455400|false
Nimitz|C|1010|926|1020|24|6|25|805|226|237625|false
Nimitz II|C|1010|1103|1020|30|6|22|975|140|290475|false
Nimitz III|C|1010|1314|1020|38|6|22|1190|178|356275|false
Orca|C|560|855|1760|20|6|30|705|241|249925|false
Orca II|C|560|1145|1760|34|6|30|995|177|348250|false
Orca III|C|560|1364|1760|37|6|30|1215|308|479550|false
PCH|B|320|855|2160|24|5|24|690|56|287825|false
PCH II|B|200|1089|2160|21|5|30|930|100|292900|false
Pelican|B|100|765|3300|18|4|22|570|26|187350|false
Pelican II|B|100|1026|3300|27|4|23|830|20|260100|false
Phalanx|B|800|626|200|16|5|15|525|44|169550|false
Phalanx II|B|800|793|200|24|5|30|690|104|182050|false
Phalanx III|B|800|934|200|27|5|30|830|89|263125|false
Pik Up|A|800|476|1140|18|3|19|355|76|122450|false
Pik Up II|A|800|607|1140|23|3|22|485|103|169775|false
Pik Up III|A|800|804|1140|28|3|25|680|173|239950|false
Polis|C|200|1039|2700|27|6|24|850|64|315900|false
Polis II|C|200|1284|2700|32|6|30|1095|178|414400|false
Privateer|B|100|675|710|18|4|25|570|46|146000|false
Privateer II|B|320|783|730|24|5|28|690|30|210150|false
Privateer III|B|100|987|1050|28|5|30|890|40|286750|false
Pterosaur|B|300|616|410|14|5|24|505|121|139575|false
Pterosaur II|B|300|681|410|18|5|30|570|113|158000|false
Pterosaur III|B|300|940|200|27|5|30|830|98|238800|false
Rambler|A|50|387|260|16|2|22|340|47|57600|false
Rambler II|A|50|502|260|20|2|30|455|42|87850|false
Ranger|B|600|631|1765|16|5|24|525|30|220225|false
Ranger II|B|600|838|1765|24|5|26|730|29|217475|false
Ranger III|B|600|944|1975|27|5|28|830|29|259025|false
Raptor|A|280|535|220|20|4|17|455|61|92575|false
Raptor II|A|210|628|220|23|4|19|550|68|123450|false
Raptor III|A|280|730|220|26|4|22|650|114|171625|false
Razorleaf|A|140|469|420|18|2|16|390|42|124100|false
Reef|C|560|1014|3500|27|5|23|850|0|253775|false
Reef II|C|560|1281|3500|32|6|30|1095|162|433875|false
Reef III|C|560|1499|3500|40|6|30|1315|243|577425|false
Renegade|C|580|1024|3970|27|6|23|850|180|324250|false
Renegade II|C|580|1278|3970|32|6|30|1095|254|447375|false
Renegade III|C|580|1488|3970|40|6|30|1315|99|578650|false
Responder|A|350|430|410|16|3|15|340|36|65300|false
Responder II|A|275|604|410|23|3|18|520|1|116150|false
Roanoke|B|420|678|2375|16|4|21|545|0|173925|false
Roanoke II|B|420|860|2375|24|4|23|730|0|270000|false
Roanoke III|B|420|1105|2375|31|4|25|975|0|324000|false
Shackleton|B|75|693|730|21|2|22|1500|19|129800|false
Shieldbreaker|B|550|940|2280|27|5|22|610|110|279425|false
Silent Runner|C|300|1164|6060|34|5|29|975|96|390150|false
Slipstream|B|450|634|340|16|4|25|525|75|175150|false
Slipstream II|B|450|846|340|24|5|29|730|52|264975|false
Sloop|A|70|414|655|18|2|15|355|50|70175|false
Sloop II|A|140|549|810|23|2|16|485|43|111575|false
Space Ox|B|420|725|2670|18|4|20|570|78|160475|false
Space Ox II|B|420|997|2300|27|6|22|830|58|256450|false
Space Ox III|B|420|1206|2300|35|6|24|1035|155|433750|false
Spacer Coyote|B|550|606|2280|14|5|22|505|105|170950|false
Spacer Coyote II|B|550|791|2280|24|5|24|690|93|249625|false
Spacer Coyote III|B|550|1139|2280|35|5|26|1035|137|382600|false
Spacer Hyena|C|900|853|1000|18|6|18|680|70|314600|false
Spacer Hyena II|C|900|1095|1000|27|7|18|900|65|404175|false
Spacer Hyena III|C|900|1516|1000|40|7|18|1315|368|555650|false
Spacer Jackal|B|600|631|1765|16|5|24|525|32|220225|false
Spacer Jackal II|B|600|944|1975|27|5|28|830|29|259025|false
Spacer Raccoon|A|140|449|200|18|3|24|390|21|83250|false
Spacer Raccoon II|A|100|610|200|23|4|28|550|42|158100|false
Spacer Raccoon III|A|140|890|410|29|4|30|810|115|272675|false
Spacer Raven|A|200|443|675|16|2|16|375|50|79550|false
Spacer Raven II|A|200|618|675|23|2|15|550|48|123475|false
Spacer Raven III|A|200|787|675|26|2|15|715|166|184475|false
Spacer Scarab|A|210|399|785|16|2|16|325|30|104125|false
Spacer Scarab II|A|210|513|785|20|2|19|440|34|130875|false
Spacer Scarab III|A|210|732|785|26|2|22|650|28|259250|false
Spacer Vulture|B|740|711|2810|16|4|15|545|101|209300|false
Spacer Vulture II|B|740|1108|2810|31|4|15|930|210|364250|false
Spacetruk|B|2310|768|1965|16|4|23|545|35|227725|false
Spacetruk II|B|2310|954|2190|24|4|22|730|41|276000|false
Spacetruk III|B|2310|1220|2110|35|4|26|995|38|348100|false
Sparrow|A|140|411|920|16|3|18|340|47|72450|false
Sparrow II|A|160|589|960|23|3|29|520|44|130750|false
Sparrow III|A|160|722|920|26|3|29|650|77|162775|false
Star Eagle|A|140|948|2280|29|5|16|760|144|398375|false
Star Semi|C|300|921|4890|29|5|21|730|96|279100|false
Starhawk|B|740|711|2810|16|4|15|545|101|209300|false
Starhawk II|B|740|1108|2810|31|4|15|930|210|364250|false
Stormrider|C|560|1047|1030|27|4|26|900|136|300675|false
Stormrider II|C|560|1240|1030|32|4|30|1095|249|387300|false
Stormrider III|C|560|1504|1030|40|4|30|1350|232|578475|false
Stronghold|C|2200|1047|2360|27|6|30|1600|84|400125|false
Sunsail|B|200|634|1150|16|4|25|525|75|136900|false
Sunsail II|B|200|813|1150|24|5|30|690|150|197840|false
Terran Boudica|C|210|992|1230|24|7|29|525|129|31701|true
Terran Boudica II|C|210|1163|1230|30|7|30|690|161|45676|true
Terran Boudica III|C|210|1414|1230|37|7|30|930|225|60580|true
Terran Cyrus|B|140|708|220|21|3|26|830|98|18986|true
Terran Cyrus II|B|140|992|220|28|3|28|995|163|28934|true
Terran Cyrus III|B|140|1099|220|35|3|30|1125|117|35076|true
Terran Saladin|C|50|1008|2260|27|7|27|705|261|30202|true
Terran Saladin II|C|70|1157|2260|34|7|30|900|406|44844|true
Terran Saladin III|C|210|1481|2300|40|7|30|1215|280|59437|true
Terran Scipio|A|210|456|465|18|3|17|355|60|10936|true
Terran Scipio II|A|210|523|540|20|3|21|420|109|15606|true
Terran Scipio III|A|210|554|655|23|3|24|520|121|19636|true
Terran Shaka|A|140|382|445|16|3|19|325|77|6573|true
Terran Shaka II|A|140|484|445|20|2|19|455|144|18500|true
Terran Shaka III|A|140|830|445|29|5|22|730|228|29075|true
Terran Tomyris|B|140|948|1130|27|2|18|730|105|30991|true
Terran Tomyris II|B|200|1156|1130|35|2|21|760|170|34775|true
Terran Trajan|B|210|712|2565|21|4|21|610|6|22630|true
Terran Trajan II|B|210|991|2565|28|4|21|610|10|22166|true
Terran Trajan III|B|210|1098|2565|35|4|22|890|8|32607|true
Thresher|A|150|452|830|18|2|15|355|125|75950|false
Thresher II|A|150|517|830|20|2|15|420|41|97400|false
Thresher III|A|150|701|830|26|2|15|600|158|170875|false
Trader Railstar|A|520|508|1200|18|3|16|405|48|93125|false
Trader Railstar II|A|520|705|1200|26|3|23|600|82|153125|false
Trader Railstar III|A|520|834|1200|33|3|27|730|78|191425|false
Trader Wagon Train|B|300|722|3055|16|4|21|545|28|206025|false
Trader Wagon Train II|B|300|875|3055|24|5|23|690|46|299050|false
Trader Wagon Train III|B|300|1015|3320|27|5|27|830|46|343850|false
Transpo|A|150|457|200|16|2|19|375|0|57150|false
Transpo II|A|150|605|200|23|2|24|520|38|92975|false
Transpo III|A|150|738|200|26|2|27|650|154|133375|false
Trebuchet|A|210|519|200|20|4|20|440|48|150125|false
Trebuchet II|A|210|629|200|23|4|23|550|122|199975|false
Trebuchet III|A|210|814|200|33|5|27|730|105|310375|false
UC Prison Shuttle|A|200|418|1090|18|1|15|0|0|58100|false
Va'ruun Dirge|A|210|519|200|20|4|20|440|48|150125|false
Va'ruun Dirge II|A|210|629|200|23|4|23|550|122|199975|false
Va'ruun Dirge III|A|210|814|200|33|5|27|730|105|310375|false
Va'ruun Eulogy|B|1100|676|2240|16|6|15|525|105|272500|false
Va'ruun Eulogy II|B|1100|846|2280|24|6|15|690|101|350075|false
Va'ruun Eulogy III|B|1100|1078|2240|31|6|18|930|155|452450|false
Va'ruun Hymn|A|1100|484|200|18|4|21|405|70|132850|false
Va'ruun Hymn II|A|1100|563|200|23|4|24|485|64|184300|false
Va'ruun Hymn III|A|1100|685|200|26|4|28|600|126|238600|false
Va'ruun Litany|A|150|452|830|18|2|15|355|125|75950|false
Va'ruun Prophecy|C|1100|908|4120|20|6|21|730|155|353350|false
Va'ruun Prophecy II|C|1100|1151|4140|30|6|26|975|130|461075|false
Va'ruun Prophecy III|C|1100|1392|4120|37|6|30|1215|186|588050|false
Va'ruun Revelation|C|560|1047|1030|27|4|26|900|136|300675|false
Va'ruun Revelation II|C|560|1240|1030|32|4|30|1095|249|387300|false
Va'ruun Vigil|B|100|675|710|18|4|25|570|46|146000|false
Va'ruun Vigil II|B|100|783|730|24|5|28|690|30|210150|false
Va'ruun Vigil III|B|100|987|1055|28|5|30|890|40|286750|false
Vagabond|A|50|502|260|20|2|22|685|40|102950|false
Vanquisher|C|1100|908|4120|20|6|21|730|155|353350|false
Vanquisher II|C|1100|1151|4140|30|6|26|975|130|461075|false
Vanquisher III|C|1100|1392|4120|37|6|30|1215|186|588050|false
Venture|B|150|694|4270|18|4|19|570|20|230875|false
Venture II|B|150|736|4270|21|4|21|610|27|262975|false
Venture III|B|150|961|4270|27|4|26|830|52|358175|false
Vindicator|C|400|858|700|20|6|23|730|92|263465|false
Vindicator II|C|400|1096|700|30|6|20|900|58|318125|false
Vindicator III|C|400|1313|700|38|6|20|1215|86|430525|false
Vista|C|800|1049|3280|27|6|21|900|57|367125|false
Vista II|C|800|1342|3280|38|6|26|1190|83|488900|false
Vista III|C|800|1336|3280|38|6|30|1350|185|548900|false
Voyager|C|720|1023|1580|27|6|29|850|163|319800|false
Voyager II|C|720|1269|1580|32|6|30|1095|136|415350|false
Voyager III|C|720|1507|1580|40|6|30|1315|346|656300|false
Wagontrain|B|300|722|3355|16|4|24|545|30|196125|false
Wagontrain II|B|300|875|3355|24|5|23|690|46|293150|false
Wagontrain III|B|300|1015|3620|27|5|27|830|46|337950|false
Wanderlust|B|400|1228|2375|16|4|21|610|0|165125|false
Wanderwell|A|200|502|800|20|2|27|455|62|85475|false
War Horse|A|200|548|675|28|2|15|550|48|132975|false
Warhammer|B|550|606|2280|14|5|25|505|110|150765|false
Warhammer II|B|550|791|2280|24|5|28|690|96|220150|false
Warhammer III|B|550|1139|2280|35|5|26|1035|137|382600|false
Warwolf|A|210|630|200|23|5|23|550|94|225175|false
Watchdog|A|50|364|200|14|3|20|310|55|42000|false
Watchdog II|A|50|471|650|18|3|27|405|47|87415|false
Watchdog III|A|50|619|805|23|4|29|550|180|165475|false
Watchdog IV|A|50|834|805|29|4|28|810|185|283600|false
Wendigo|A|100|474|410|18|3|15|390|119|91325|false
Wendigo II|A|100|568|410|23|3|19|485|44|133100|false
Zumwalt|B|580|689|470|18|5|23|570|103|206250|false
Zumwalt II|B|580|815|470|24|5|25|690|130|228950|false
Zumwalt III|B|580|1014|470|28|5|27|890|226|296625|false
'@

function New-Slug([string]$value) {
  return ($value.ToLowerInvariant() -replace "[^a-z0-9]+", "-" -replace "^-|-$", "")
}

function New-Location([string]$system, [string]$vendor, [Nullable[int]]$level = $null, [bool]$dlc = $false) {
  return [ordered]@{
    type = "vendor"
    system = $system
    vendor = $vendor
    requiredLevel = $level
    isDlcVendor = $dlc
  }
}

function New-PilotingRequirement([int]$rank) {
  return [ordered]@{
    skill = "Piloting"
    rank = $rank
  }
}

$commonHighTierVendors64 = @(
  (New-Location "Algorab" "Danica Volkov" 64),
  (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" 64),
  (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" 64),
  (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" 64),
  (New-Location "Kavnyk" "Dumar Hasadi" 64 $true),
  (New-Location "Porrima" "Lon Anderssen" 64),
  (New-Location "Porrima" "Ship Services Technician (Paradiso)" 64),
  (New-Location $null "Shipbuilder (Outpost)" 64),
  (New-Location "Sol" "Ship Services Technician (Cydonia)" 64),
  (New-Location "Sol" "Ship Services Technician (New Homestead)" 64),
  (New-Location "Volii" "Ship Services Technician (Neon)" 64)
)

$commonHighTierVendors72 = @(
  (New-Location "Algorab" "Danica Volkov" 72),
  (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" 72),
  (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" 72),
  (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" 72),
  (New-Location "Kavnyk" "Dumar Hasadi" 72 $true),
  (New-Location "Porrima" "Lon Anderssen" 72),
  (New-Location "Porrima" "Ship Services Technician (Paradiso)" 72),
  (New-Location $null "Shipbuilder (Outpost)" 72),
  (New-Location "Sol" "Ship Services Technician (Cydonia)" 72),
  (New-Location "Sol" "Ship Services Technician (New Homestead)" 72),
  (New-Location "Volii" "Ship Services Technician (Neon)" 72)
)

function New-CommonShipTechList([Nullable[int]]$level = $null, [bool]$includeAkila = $false, [bool]$includeValo = $false, [bool]$includeSol = $true, [bool]$includeOutpost = $true, [bool]$includeAlgorab = $true, [bool]$includeKavnyk = $true) {
  $locations = @()
  if ($includeAlgorab) { $locations += (New-Location "Algorab" "Danica Volkov" $level) }
  $locations += (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" $level)
  $locations += (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level)
  if ($includeAkila) { $locations += (New-Location "Cheyenne" "Ship Services Technician (Akila City)" $level) }
  $locations += (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" $level)
  if ($includeKavnyk) { $locations += (New-Location "Kavnyk" "Dumar Hasadi" $level $true) }
  $locations += (New-Location "Porrima" "Lon Anderssen" $level)
  $locations += (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level)
  if ($includeOutpost) { $locations += (New-Location $null "Shipbuilder (Outpost)" $level) }
  if ($includeSol) {
    $locations += (New-Location "Sol" "Ship Services Technician (Cydonia)" $level)
    $locations += (New-Location "Sol" "Ship Services Technician (New Homestead)" $level)
  }
  if ($includeValo) { $locations += (New-Location "Valo" "Ship Services Technician (HopeTown)" $level) }
  $locations += (New-Location "Volii" "Ship Services Technician (Neon)" $level)
  return $locations
}

function New-HopeTechList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Cheyenne" "Ship Services Technician (Akila City)" $level),
    (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" $level),
    (New-Location "Kavnyk" "Dumar Hasadi" $level $true),
    (New-Location "Porrima" "Lon Anderssen" $level),
    (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level),
    (New-Location $null "Shipbuilder (Outpost)" $level),
    (New-Location "Valo" "Ship Services Technician (HopeTown)" $level),
    (New-Location "Volii" "Ship Services Technician (Neon)" $level)
  )
}

function New-OrcaReefList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level),
    (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level),
    (New-Location "Volii" "Ship Services Technician (Neon)" $level),
    (New-Location "Volii" "Veronica Young" $level)
  )
}

function New-DeimosPolisList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Sol" "Nikau Henderson" $level),
    (New-Location "Sol" "Ship Services Technician (Cydonia)" $level),
    (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" $level),
    (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level),
    (New-Location "Sol" "Ship Services Technician (New Homestead)" $level)
  )
}

function New-AkilaHopeList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Cheyenne" "Ship Services Technician (Akila City)" $level),
    (New-Location "Valo" "Inaya Rehman" $level),
    (New-Location "Valo" "Ship Services Technician (HopeTown)" $level)
  )
}

function New-StarhawkList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" $level),
    (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level),
    (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" $level),
    (New-Location "Porrima" "Lon Anderssen" $level),
    (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level),
    (New-Location $null "Shipbuilder (Outpost)" $level)
  )
}

function New-VanquisherList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" $level),
    (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level),
    (New-Location "Cheyenne" "Ship Services Technician (Akila City)" $level),
    (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" $level),
    (New-Location "Narion" "Havershaw" $level),
    (New-Location "Porrima" "Lon Anderssen" $level),
    (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level),
    (New-Location "Sol" "Ship Services Technician (Cydonia)" $level),
    (New-Location "Sol" "Ship Services Technician (New Homestead)" $level),
    (New-Location "Valo" "Ship Services Technician (HopeTown)" $level),
    (New-Location "Volii" "Ship Services Technician (Neon)" $level)
  )
}

function New-ZumwaltList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Porrima" "Lon Anderssen" $level),
    (New-Location "Cheyenne" "Ship Services Technician (Akila City)" $level),
    (New-Location "Sol" "Ship Services Technician (Cydonia)" $level),
    (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" $level),
    (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" $level),
    (New-Location "Valo" "Ship Services Technician (HopeTown)" $level),
    (New-Location "Volii" "Ship Services Technician (Neon)" $level),
    (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level),
    (New-Location "Sol" "Ship Services Technician (New Homestead)" $level),
    (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level)
  )
}

function New-TaiyoVendorList([Nullable[int]]$level = $null, [bool]$includeAlgorab = $false) {
  $locations = @()
  if ($includeAlgorab) { $locations += (New-Location "Algorab" "Danica Volkov" $level) }
  $locations += (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level)
  $locations += (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level)
  $locations += (New-Location "Volii" "Ship Services Technician (Neon)" $level)
  $locations += (New-Location "Volii" "Veronica Young" $level)
  return $locations
}

function New-BroadShipTechList([Nullable[int]]$level = $null, [bool]$includeAlgorab = $true, [bool]$includeStroudKiosk = $false) {
  $locations = @()
  if ($includeAlgorab) { $locations += (New-Location "Algorab" "Danica Volkov" $level) }
  $locations += (New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" $level)
  $locations += (New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" $level)
  $locations += (New-Location "Cheyenne" "Ship Services Technician (Akila City)" $level)
  $locations += (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" $level)
  $locations += (New-Location "Narion" "Havershaw" $level)
  $locations += (New-Location "Porrima" "Lon Anderssen" $level)
  $locations += (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level)
  $locations += (New-Location "Sol" "Ship Services Technician (Cydonia)" $level)
  $locations += (New-Location "Sol" "Ship Services Technician (New Homestead)" $level)
  $locations += (New-Location "Valo" "Ship Services Technician (HopeTown)" $level)
  $locations += (New-Location "Volii" "Ship Services Technician (Neon)" $level)
  if ($includeStroudKiosk) { $locations += (New-Location "Volii" "Stroud-Eklund Ship Kiosk" $level) }
  return $locations
}

function New-SettledPassengerList([Nullable[int]]$level = $null) {
  return @(
    (New-Location "Porrima" "Lon Anderssen" $level),
    (New-Location "Cheyenne" "Ship Services Technician (Akila City)" $level),
    (New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" $level),
    (New-Location "Valo" "Ship Services Technician (HopeTown)" $level),
    (New-Location "Volii" "Ship Services Technician (Neon)" $level),
    (New-Location "Porrima" "Ship Services Technician (Paradiso)" $level),
    (New-Location $null "Shipbuilder (Outpost)" $level)
  )
}

function New-PiracyAcquisition([string]$sourceUrl, [int]$pilotingRank, [Nullable[int]]$level = $null, [string[]]$extraNotes = @()) {
  $notes = @("Not available for purchase; can be acquired through piracy.")
  if ($level) { $notes += "May require player level $level+ to appear." }
  $notes += $extraNotes
  return [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement $pilotingRank); locations = @(); sourceUrl = $sourceUrl; notes = $notes }
}

$purchaseData = @{
  "Autobahn III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = $commonHighTierVendors64; sourceUrl = "https://inara.cz/starfield/ship/1982/"; notes = @("Vendor stock can be partially random.") }
  "Autobahn" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList $null $false $false $true $true $false $true); sourceUrl = "https://inara.cz/starfield/ship/2484/"; notes = @("Vendor stock can be partially random.") }
  "Autobahn II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList 46); sourceUrl = "https://inara.cz/starfield/ship/2003/"; notes = @("Vendor stock can be partially random.") }
  "Babylon II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-HopeTechList 54); sourceUrl = "https://inara.cz/starfield/ship/2486/"; notes = @("Vendor stock can be partially random.") }
  "Blackhawk III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Porrima" "Lon Anderssen" 60),(New-Location "Cheyenne" "Ship Services Technician (Akila City)" 60),(New-Location "Sol" "Ship Services Technician (Cydonia)" 60),(New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" 60),(New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" 60),(New-Location "Valo" "Ship Services Technician (HopeTown)" 60),(New-Location "Volii" "Ship Services Technician (Neon)" 60),(New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" 60),(New-Location "Sol" "Ship Services Technician (New Homestead)" 60),(New-Location "Porrima" "Ship Services Technician (Paradiso)" 60)); sourceUrl = "https://inara.cz/starfield/ship/2491/"; notes = @("Vendor stock can be partially random.") }
  "Carry ALL III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-CommonShipTechList 62); sourceUrl = "https://inara.cz/starfield/ship/2495/"; notes = @("Vendor stock can be partially random.") }
  "Crossbow III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = $commonHighTierVendors72; sourceUrl = "https://inara.cz/starfield/ship/1984/"; notes = @("Vendor stock can be partially random.") }
  "Voyager III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = $commonHighTierVendors72; sourceUrl = "https://inara.cz/starfield/ship/112/"; notes = @("Vendor stock can be partially random.") }
  "Vanquisher" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-VanquisherList $null); sourceUrl = "https://inara.cz/starfield/ship/2592/"; notes = @("Vendor stock can be partially random.") }
  "Vanquisher II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-VanquisherList 44); sourceUrl = "https://inara.cz/starfield/ship/2593/"; notes = @("Vendor stock can be partially random.") }
  "Vanquisher III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-VanquisherList 64); sourceUrl = "https://inara.cz/starfield/ship/2000/"; notes = @("Vendor stock can be partially random.") }
  "Renegade II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Cheyenne" "Ship Services Technician (Akila City)" 54),(New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" 54),(New-Location "Kavnyk" "Dumar Hasadi" 54 $true),(New-Location "Porrima" "Lon Anderssen" 54),(New-Location "Porrima" "Ship Services Technician (Paradiso)" 54),(New-Location $null "Shipbuilder (Outpost)" 54),(New-Location "Valo" "Ship Services Technician (HopeTown)" 54),(New-Location "Volii" "Ship Services Technician (Neon)" 54)); sourceUrl = "https://inara.cz/starfield/ship/2568/"; notes = @("Vendor stock can be partially random.") }
  "Renegade" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-HopeTechList $null); sourceUrl = "https://inara.cz/starfield/ship/2567/"; notes = @("Vendor stock can be partially random.") }
  "Renegade III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-HopeTechList 72); sourceUrl = "https://inara.cz/starfield/ship/2569/"; notes = @("Vendor stock can be partially random.") }
  "Reef III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" 72),(New-Location "Porrima" "Ship Services Technician (Paradiso)" 72),(New-Location "Volii" "Ship Services Technician (Neon)" 72),(New-Location "Volii" "Veronica Young" 72)); sourceUrl = "https://inara.cz/starfield/ship/1997/"; notes = @("Vendor stock can be partially random.") }
  "Reef II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-OrcaReefList 54); sourceUrl = "https://inara.cz/starfield/ship/2566/"; notes = @("Vendor stock can be partially random.") }
  "Orca III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" 64),(New-Location "Porrima" "Ship Services Technician (Paradiso)" 64),(New-Location "Volii" "Ship Services Technician (Neon)" 64),(New-Location "Volii" "Veronica Young" 64)); sourceUrl = "https://inara.cz/starfield/ship/1989/"; notes = @("Vendor stock can be partially random.") }
  "Orca" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-OrcaReefList $null); sourceUrl = "https://inara.cz/starfield/ship/1002/"; notes = @("Vendor stock can be partially random.") }
  "Orca II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-OrcaReefList 46); sourceUrl = "https://inara.cz/starfield/ship/2550/"; notes = @("Vendor stock can be partially random.") }
  "Crimson Fleet Wight III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kryx" "Jasmine Durand" 72)); sourceUrl = "https://inara.cz/starfield/ship/2515/"; notes = @("Vendor stock can be partially random.") }
  "Crimson Fleet Wraith III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kryx" "Jasmine Durand" 64)); sourceUrl = "https://inara.cz/starfield/ship/2517/"; notes = @("Vendor stock can be partially random.") }
  "Crimson Fleet Wraith" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kryx" "Jasmine Durand")); sourceUrl = "https://inara.cz/starfield/ship/1003/"; notes = @("Vendor stock can be partially random.") }
  "Crimson Fleet Wraith II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kryx" "Jasmine Durand" 46)); sourceUrl = "https://inara.cz/starfield/ship/2516/"; notes = @("Vendor stock can be partially random.") }
  "Va'ruun Prophecy" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kavnyk" "Dumar Hasadi" $null $true)); sourceUrl = "https://inara.cz/starfield/ship/2665/"; notes = @("Requires DLC vendor according to INARA.", "Vendor stock can be partially random.") }
  "Va'ruun Prophecy II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kavnyk" "Dumar Hasadi" 44 $true)); sourceUrl = "https://inara.cz/starfield/ship/2666/"; notes = @("Requires DLC vendor according to INARA.", "Vendor stock can be partially random.") }
  "Va'ruun Prophecy III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kavnyk" "Dumar Hasadi" 64 $true)); sourceUrl = "https://inara.cz/starfield/ship/2667/"; notes = @("Requires DLC vendor according to INARA.") }
  "Va'ruun Revelation II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Kavnyk" "Dumar Hasadi" 54 $true)); sourceUrl = "https://inara.cz/starfield/ship/2669/"; notes = @("Requires DLC vendor according to INARA.", "Vendor stock can be partially random.") }
  "Silent Runner" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Valo" "Inaya Rehman")); sourceUrl = "https://inara.cz/starfield/ship/1015/"; notes = @("Vendor stock can be partially random.") }
  "Narwhal" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Volii" "Veronica Young")); sourceUrl = "https://inara.cz/starfield/ship/1017/"; notes = @("Vendor stock can be partially random.") }
  "Abyss Trekker" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Porrima" "Ship Services Technician (Paradiso)")); sourceUrl = "https://inara.cz/starfield/ship/1014/"; notes = @("Vendor stock can be partially random.") }
  "Shieldbreaker" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)")); sourceUrl = "https://inara.cz/starfield/ship/373/"; notes = @("Vendor stock can be partially random.") }
  "Kepler R" = [ordered]@{ method = "quest_reward"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/1346/"; notes = @("Reward from the side quest Overdesigned.") }
  "Kepler S" = [ordered]@{ method = "quest_reward"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/1347/"; notes = @("Reward from the side quest Overdesigned.") }
  "Razorleaf" = [ordered]@{ method = "quest_reward"; status = "verified"; requiredSkill = $null; locations = @(); sourceUrl = "https://inara.cz/starfield/ship/946/"; notes = @("Obtained during the Mantis side quest.") }
  "Star Eagle" = [ordered]@{ method = "quest_reward"; status = "verified"; requiredSkill = $null; locations = @(); sourceUrl = "https://inara.cz/starfield/ship/947/"; notes = @("Reward from the Freestar Rangers quest The Hammer Falls.") }
  "Terran Saladin II" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/4671/"; notes = @("Not available for purchase; can be acquired through piracy.", "Requires Terran Armada expansion.") }
  "Terran Boudica III" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/4669/"; notes = @("Not available for purchase; can be acquired through piracy.", "Requires Terran Armada expansion.") }
  "Terran Saladin III" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/4672/"; notes = @("Not available for purchase; can be acquired through piracy.", "Requires Terran Armada expansion.") }
  "Terran Saladin" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/4670/"; notes = @("Not available for purchase; can be acquired through piracy.", "Requires Terran Armada expansion.") }
  "Ecliptic Claymore III" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/2646/"; notes = @("Not available for purchase; can be acquired through piracy.", "May require player level 62+ to appear.") }
  "Ecliptic Claymore" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/138/" 4)
  "Ecliptic Claymore II" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2645/" 4 44)
  "Ecliptic Rapier III" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2651/" 3 52)
  "Ecliptic Scimitar III" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2653/" 3 60)
  "Spacer Hyena III" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/2675/"; notes = @("Not available for purchase; can be acquired through piracy.", "May require player level 72+ to appear.") }
  "Spacer Vulture II" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2683/" 3 56)
  "Chimera III" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @(); sourceUrl = "https://inara.cz/starfield/ship/3931/"; notes = @("Not available for purchase; can be acquired through piracy.") }
  "Dragonfire" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList $null $false $false $false $true $false $true); sourceUrl = "https://inara.cz/starfield/ship/1011/"; notes = @("Vendor stock can be partially random.") }
  "Dragonfire II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList 34); sourceUrl = "https://inara.cz/starfield/ship/110/"; notes = @("Vendor stock can be partially random.") }
  "Dullahan III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-HopeTechList 64); sourceUrl = "https://inara.cz/starfield/ship/2521/"; notes = @("Vendor stock can be partially random.") }
  "Highlander" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Cheyenne" "Ship Services Technician (Akila City)"),(New-Location "Valo" "Ship Services Technician (HopeTown)")); sourceUrl = "https://inara.cz/starfield/ship/2530/"; notes = @("Vendor stock can be partially random.") }
  "Highlander II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Cheyenne" "Ship Services Technician (Akila City)" 54),(New-Location "Valo" "Ship Services Technician (HopeTown)" 54)); sourceUrl = "https://inara.cz/starfield/ship/2531/"; notes = @("Vendor stock can be partially random.") }
  "Highlander III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Cheyenne" "Ship Services Technician (Akila City)" 72),(New-Location "Valo" "Ship Services Technician (HopeTown)" 72)); sourceUrl = "https://inara.cz/starfield/ship/2532/"; notes = @("Vendor stock can be partially random.") }
  "Nimitz" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Porrima" "Lon Anderssen"),(New-Location "Cheyenne" "Ship Services Technician (Akila City)"),(New-Location "Sol" "Ship Services Technician (Cydonia)"),(New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)"),(New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)"),(New-Location "Valo" "Ship Services Technician (HopeTown)")); sourceUrl = "https://inara.cz/starfield/ship/1001/"; notes = @("Vendor stock can be partially random.") }
  "Nimitz III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Porrima" "Lon Anderssen" 62),(New-Location "Cheyenne" "Ship Services Technician (Akila City)" 62),(New-Location "Sol" "Ship Services Technician (Cydonia)" 62),(New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" 62),(New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)" 62),(New-Location "Valo" "Ship Services Technician (HopeTown)" 62),(New-Location "Volii" "Ship Services Technician (Neon)" 62),(New-Location "Alpha Centauri" "Ship Services Technician (New Atlantis)" 62),(New-Location "Sol" "Ship Services Technician (New Homestead)" 62),(New-Location "Porrima" "Ship Services Technician (Paradiso)" 62)); sourceUrl = "https://inara.cz/starfield/ship/2549/"; notes = @("Vendor stock can be partially random.") }
  "Polis II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-DeimosPolisList 54); sourceUrl = "https://inara.cz/starfield/ship/2557/"; notes = @("Vendor stock can be partially random.") }
  "Spacetruk III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-AkilaHopeList 62); sourceUrl = "https://inara.cz/starfield/ship/2576/"; notes = @("Vendor stock can be partially random.") }
  "Star Semi" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-AkilaHopeList $null); sourceUrl = "https://inara.cz/starfield/ship/1010/"; notes = @("Vendor stock can be partially random.") }
  "Starhawk II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-StarhawkList 56); sourceUrl = "https://inara.cz/starfield/ship/2578/"; notes = @("Vendor stock can be partially random.") }
  "Stormrider II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList 54 $true $true $true $true $false $true); sourceUrl = "https://inara.cz/starfield/ship/2580/"; notes = @("Vendor stock can be partially random.") }
  "Stormrider III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList 76 $true $true $true $true $false $true); sourceUrl = "https://inara.cz/starfield/ship/2581/"; notes = @("Vendor stock can be partially random.") }
  "Stronghold" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = @((New-Location "Cheyenne" "Ship Services Technician (Akila City)")); sourceUrl = "https://inara.cz/starfield/ship/1016/"; notes = @("Vendor stock can be partially random.") }
  "Vista II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList 62 $false $false $true $true $false $true); sourceUrl = "https://inara.cz/starfield/ship/2598/"; notes = @("Vendor stock can be partially random.") }
  "Vista III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 4); locations = (New-CommonShipTechList 76 $false $false $false $false $false $true); sourceUrl = "https://inara.cz/starfield/ship/1991/"; notes = @("Vendor stock can be partially random.") }
  "Zumwalt III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-ZumwaltList 52); sourceUrl = "https://inara.cz/starfield/ship/2605/"; notes = @("Vendor stock can be partially random.") }
  "Aegis" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Sol" "Nikau Henderson")); sourceUrl = "https://inara.cz/starfield/ship/1183/"; notes = @("Vendor stock can be partially random.") }
  "Asphalt CB II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-CommonShipTechList 32 $false $false $true $true $false $false); sourceUrl = "https://inara.cz/starfield/ship/2482/"; notes = @("Vendor stock can be partially random.") }
  "Bireme II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-DeimosPolisList 40); sourceUrl = "https://inara.cz/starfield/ship/2488/"; notes = @("Vendor stock can be partially random.") }
  "Blackhawk II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-ZumwaltList 46); sourceUrl = "https://inara.cz/starfield/ship/2490/"; notes = @("Vendor stock can be partially random.") }
  "Carry ALL" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-CommonShipTechList $null $false $false $true $true $true $true); sourceUrl = "https://inara.cz/starfield/ship/979/"; notes = @("Vendor stock can be partially random.") }
  "Carry ALL II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-CommonShipTechList 38 $false $false $true $true $true $true); sourceUrl = "https://inara.cz/starfield/ship/2494/"; notes = @("Vendor stock can be partially random.") }
  "Conquerer" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-BroadShipTechList $null $true $true); sourceUrl = "https://inara.cz/starfield/ship/1008/"; notes = @("Vendor stock can be partially random.") }
  "Crimson Fleet Ghost III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = @((New-Location "Kryx" "Jasmine Durand" 32)); sourceUrl = "https://inara.cz/starfield/ship/987/"; notes = @("Vendor stock can be partially random.") }
  "Crimson Fleet Specter II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Kryx" "Jasmine Durand" 24)); sourceUrl = "https://inara.cz/starfield/ship/990/"; notes = @("Vendor stock can be partially random.") }
  "Crimson Fleet Specter III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Kryx" "Jasmine Durand" 48)); sourceUrl = "https://inara.cz/starfield/ship/2512/"; notes = @("Vendor stock can be partially random.") }
  "Ecliptic Cutlass II" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2647/" 3 40)
  "Ecliptic Rapier II" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2650/" 3 32)
  "Ecliptic Scimitar II" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2652/" 3 46)
  "Falcon II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-TaiyoVendorList 24 $true); sourceUrl = "https://inara.cz/starfield/ship/989/"; notes = @("Vendor stock can be partially random.") }
  "Falcon III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-TaiyoVendorList 48 $false); sourceUrl = "https://inara.cz/starfield/ship/2526/"; notes = @("Vendor stock can be partially random.") }
  "Galileo III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = (New-BroadShipTechList 38 $true $true); sourceUrl = "https://inara.cz/starfield/ship/1986/"; notes = @("Vendor stock can be partially random.") }
  "Hoplite II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-DeimosPolisList 22); sourceUrl = "https://inara.cz/starfield/ship/980/"; notes = @("Vendor stock can be partially random.") }
  "Hoplite III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-DeimosPolisList 48); sourceUrl = "https://inara.cz/starfield/ship/2533/"; notes = @("Vendor stock can be partially random.") }
  "Mako III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = (New-TaiyoVendorList 64 $false); sourceUrl = "https://inara.cz/starfield/ship/2542/"; notes = @("Vendor stock can be partially random.") }
  "Murasame" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Alpha Centauri" "Ship Services Technician (Gagarin)")); sourceUrl = "https://inara.cz/starfield/ship/1004/"; notes = @("Vendor stock can be partially random.") }
  "PCH II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-AkilaHopeList 48); sourceUrl = "https://inara.cz/starfield/ship/2005/"; notes = @("Vendor stock can be partially random.") }
  "Phalanx II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-DeimosPolisList 32); sourceUrl = "https://inara.cz/starfield/ship/988/"; notes = @("Vendor stock can be partially random.") }
  "Phalanx III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-DeimosPolisList 46); sourceUrl = "https://inara.cz/starfield/ship/2553/"; notes = @("Vendor stock can be partially random.") }
  "Pik Up III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = (New-AkilaHopeList 48); sourceUrl = "https://inara.cz/starfield/ship/2555/"; notes = @("Vendor stock can be partially random.") }
  "Pterosaur II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-HopeTechList 22); sourceUrl = "https://inara.cz/starfield/ship/978/"; notes = @("Vendor stock can be partially random.") }
  "Pterosaur III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-HopeTechList 40); sourceUrl = "https://inara.cz/starfield/ship/2559/"; notes = @("Vendor stock can be partially random.") }
  "Ranger III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-ZumwaltList 46); sourceUrl = "https://inara.cz/starfield/ship/2561/"; notes = @("Vendor stock can be partially random.") }
  "Space Ox II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-HopeTechList 40); sourceUrl = "https://inara.cz/starfield/ship/2573/"; notes = @("Vendor stock can be partially random.") }
  "Spacer Coyote" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2637/" 3)
  "Spacer Coyote II" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2638/" 3 32)
  "Spacer Raccoon III" = [ordered]@{ method = "piracy"; status = "verified"; requiredSkill = $null; locations = @(); sourceUrl = "https://inara.cz/starfield/ship/2678/"; notes = @("Not available for purchase; can be acquired through piracy.", "May require player level 64+ to appear.") }
  "Spacer Vulture" = (New-PiracyAcquisition "https://inara.cz/starfield/ship/2643/" 3 18)
  "Spacetruk" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-AkilaHopeList $null); sourceUrl = "https://inara.cz/starfield/ship/999/"; notes = @("Vendor stock can be partially random.") }
  "Spacetruk II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-AkilaHopeList 36); sourceUrl = "https://inara.cz/starfield/ship/2575/"; notes = @("Vendor stock can be partially random.") }
  "Starhawk" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-StarhawkList $null); sourceUrl = "https://inara.cz/starfield/ship/2577/"; notes = @("Vendor stock can be partially random.") }
  "Sunsail II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Cheyenne" "Ship Services Technician (Akila City)" 32),(New-Location "Ixyll" "Ship Services Technician (Eleos Retreat)" 32),(New-Location "Porrima" "Ship Services Technician (Paradiso)" 32),(New-Location $null "Shipbuilder (Outpost)" 32),(New-Location "Valo" "Ship Services Technician (HopeTown)" 32),(New-Location "Volii" "Ship Services Technician (Neon)" 32)); sourceUrl = "https://inara.cz/starfield/ship/996/"; notes = @("Vendor stock can be partially random.") }
  "Trader Railstar III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = @((New-Location "Kavnyk" "Dumar Hasadi" 54 $true),(New-Location "Porrima" "Lon Anderssen" 54)); sourceUrl = "https://inara.cz/starfield/ship/2585/"; notes = @("Requires DLC vendor according to INARA.", "Vendor stock can be partially random.") }
  "Trader Wagon Train II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Kavnyk" "Dumar Hasadi" 32 $true),(New-Location "Porrima" "Lon Anderssen" 32)); sourceUrl = "https://inara.cz/starfield/ship/2587/"; notes = @("Requires DLC vendor according to INARA.", "Vendor stock can be partially random.") }
  "Transpo III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = (New-SettledPassengerList 46); sourceUrl = "https://inara.cz/starfield/ship/2590/"; notes = @("Vendor stock can be partially random.") }
  "Va'ruun Eulogy" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = @((New-Location "Kavnyk" "Dumar Hasadi" $null $true)); sourceUrl = "https://inara.cz/starfield/ship/2658/"; notes = @("Requires DLC vendor according to INARA.", "Vendor stock can be partially random.") }
  "Va'ruun Hymn III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = @((New-Location "Kavnyk" "Dumar Hasadi" 38 $true)); sourceUrl = "https://inara.cz/starfield/ship/2663/"; notes = @("Requires DLC vendor according to INARA.", "Vendor stock can be partially random.") }
  "Wagontrain II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-HopeTechList 32); sourceUrl = "https://inara.cz/starfield/ship/2600/"; notes = @("Vendor stock can be partially random.") }
  "Warhammer" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-CommonShipTechList $null $false $false $true $true $true $true); sourceUrl = "https://inara.cz/starfield/ship/977/"; notes = @("Vendor stock can be partially random.") }
  "Warhammer II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-CommonShipTechList 32 $false $false $true $true $true $true); sourceUrl = "https://inara.cz/starfield/ship/997/"; notes = @("Vendor stock can be partially random.") }
  "Watchdog III" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = (New-AkilaHopeList 32); sourceUrl = "https://inara.cz/starfield/ship/983/"; notes = @("Vendor stock can be partially random.") }
  "Watchdog IV" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = $null; locations = (New-AkilaHopeList 58); sourceUrl = "https://inara.cz/starfield/ship/2006/"; notes = @("Vendor stock can be partially random.") }
  "Zumwalt II" = [ordered]@{ method = "vendor"; status = "verified"; requiredSkill = (New-PilotingRequirement 3); locations = (New-ZumwaltList 32); sourceUrl = "https://inara.cz/starfield/ship/2604/"; notes = @("Vendor stock can be partially random.") }
}

function Get-Acquisition([string]$shipName) {
  if ($purchaseData.ContainsKey($shipName)) {
    return $purchaseData[$shipName]
  }

  return [ordered]@{
    method = "unknown"
    status = "not_collected"
    requiredSkill = $null
    locations = @()
    sourceUrl = $null
    notes = @("Purchase/acquisition info not collected yet.")
  }
}

function Add-Scores($ship) {
  $exploration = ($ship.jump * 3) + ($ship.fuel * 0.03) + ($ship.cargo * 0.02) + ($ship.crew * 5)
  $combat = ($ship.damage * 3) + ($ship.shield * 0.08) + ($ship.hull * 0.05) + ($ship.reactor * 4)

  $ship | Add-Member -NotePropertyName scores -NotePropertyValue ([ordered]@{
    explorationRaw = [math]::Round($exploration, 2)
    combatRaw = [math]::Round($combat, 2)
    exploration = 0
    combat = 0
    balanced = 0
    explorationFocused = 0
    combatFocused = 0
  })

  return $ship
}

function Update-NormalizedScores($ships) {
  $maxExploration = ($ships | ForEach-Object { $_.scores.explorationRaw } | Measure-Object -Maximum).Maximum
  $maxCombat = ($ships | ForEach-Object { $_.scores.combatRaw } | Measure-Object -Maximum).Maximum

  foreach ($ship in $ships) {
    $exploration = if ($maxExploration -gt 0) { ($ship.scores.explorationRaw / $maxExploration) * 100 } else { 0 }
    $combat = if ($maxCombat -gt 0) { ($ship.scores.combatRaw / $maxCombat) * 100 } else { 0 }

    $ship.scores.exploration = [math]::Round($exploration, 2)
    $ship.scores.combat = [math]::Round($combat, 2)
    $ship.scores.balanced = [math]::Round(($exploration * 0.45) + ($combat * 0.55), 2)
    $ship.scores.explorationFocused = [math]::Round(($exploration * 0.65) + ($combat * 0.35), 2)
    $ship.scores.combatFocused = [math]::Round(($exploration * 0.30) + ($combat * 0.70), 2)
  }

  return $ships
}

$ships = @()
$lines = $rawShips -split "`n" | Where-Object { $_.Trim().Length -gt 0 }

foreach ($line in $lines) {
  $parts = $line.Trim() -split "\|"
  $ship = [ordered]@{
    id = "ship-" + (New-Slug $parts[0])
    name = $parts[0]
    class = $parts[1]
    fuel = [int]$parts[2]
    hull = [int]$parts[3]
    cargo = [int]$parts[4]
    reactor = [int]$parts[5]
    crew = [int]$parts[6]
    jump = [int]$parts[7]
    shield = [int]$parts[8]
    damage = [int]$parts[9]
    value = [int]$parts[10]
    isDlc = [bool]::Parse($parts[11])
    acquisition = (Get-Acquisition $parts[0])
  }
  $ships += Add-Scores ([pscustomobject]$ship)
}

$ships = @(Update-NormalizedScores $ships)

function New-Ranking($ships, [string]$scoreKey, [string]$id, [string]$name, [hashtable]$weights, [int]$limit = 50) {
  $rank = 0
  $items = $ships |
    Sort-Object -Property @{ Expression = { $_.scores.$scoreKey }; Descending = $true }, @{ Expression = { $_.name }; Ascending = $true } |
    Select-Object -First $limit |
    ForEach-Object {
      $rank++
      [ordered]@{
        rank = $rank
        shipId = $_.id
        name = $_.name
        class = $_.class
        score = $_.scores.$scoreKey
        explorationScore = $_.scores.exploration
        combatScore = $_.scores.combat
        fuel = $_.fuel
        hull = $_.hull
        cargo = $_.cargo
        reactor = $_.reactor
        crew = $_.crew
        jump = $_.jump
        shield = $_.shield
        damage = $_.damage
        value = $_.value
        isDlc = $_.isDlc
        acquisition = $_.acquisition
      }
    }

  return [ordered]@{
    id = $id
    name = $name
    scoreKey = $scoreKey
    weights = $weights
    items = @($items)
  }
}

$shipsJson = [ordered]@{
  metadata = [ordered]@{
    game = "Starfield"
    dataset = "ships"
    version = 1
    generatedAt = $generatedAt
    source = $sourceUrl
    count = $ships.Count
    notes = @(
      "Stats base sem bonus de skills, seguindo a nota da INARA.",
      "Scores brutos calculados localmente e depois normalizados para escala 0-100 antes da ponderacao.",
      "balanced = normalizedExplorationScore * 0.45 + normalizedCombatScore * 0.55.",
      "explorationFocused = normalizedExplorationScore * 0.65 + normalizedCombatScore * 0.35.",
      "combatFocused = normalizedExplorationScore * 0.30 + normalizedCombatScore * 0.70."
    )
  }
  items = @($ships)
}

$rankingsJson = [ordered]@{
  metadata = [ordered]@{
    game = "Starfield"
    dataset = "ship_rankings"
    version = 1
    generatedAt = $generatedAt
    source = $sourceUrl
    formulas = [ordered]@{
      explorationRaw = "jump * 3 + fuel * 0.03 + cargo * 0.02 + crew * 5"
      combatRaw = "damage * 3 + shield * 0.08 + hull * 0.05 + reactor * 4"
      explorationScore = "explorationRaw normalized to 0-100"
      combatScore = "combatRaw normalized to 0-100"
      balanced = "explorationScore * 0.45 + combatScore * 0.55"
      explorationFocused = "explorationScore * 0.65 + combatScore * 0.35"
      combatFocused = "explorationScore * 0.30 + combatScore * 0.70"
    }
  }
  rankings = @(
    (New-Ranking $ships "balanced" "balanced" "Exploracao + Combate" @{ exploration = 0.45; combat = 0.55 }),
    (New-Ranking $ships "explorationFocused" "exploration" "Foco em Exploracao" @{ exploration = 0.65; combat = 0.35 }),
    (New-Ranking $ships "combatFocused" "combat" "Foco em Combate" @{ exploration = 0.30; combat = 0.70 }),
    (New-Ranking ($ships | Where-Object { $_.class -eq "A" }) "balanced" "class-a" "Top Class A" @{ exploration = 0.45; combat = 0.55 }),
    (New-Ranking ($ships | Where-Object { $_.class -eq "B" }) "balanced" "class-b" "Top Class B" @{ exploration = 0.45; combat = 0.55 }),
    (New-Ranking ($ships | Where-Object { $_.class -eq "C" }) "balanced" "class-c" "Top Class C" @{ exploration = 0.45; combat = 0.55 }),
    (New-Ranking ($ships | Where-Object { $_.acquisition.method -eq "vendor" }) "balanced" "purchasable" "Top Compraveis Verificados" @{ exploration = 0.45; combat = 0.55 }),
    (New-Ranking ($ships | Where-Object { $_.acquisition.method -eq "quest_reward" }) "balanced" "free-quest" "Top Gratis / Quest Reward" @{ exploration = 0.45; combat = 0.55 }),
    (New-Ranking ($ships | Where-Object { $_.class -in @("A", "B") -and $_.value -le 300000 -and -not $_.isDlc }) "balanced" "midgame" "Top Midgame" @{ exploration = 0.45; combat = 0.55 })
  )
}

$dataDir = Join-Path $PSScriptRoot "..\data"
$shipsJson | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $dataDir "ships.json") -Encoding UTF8
$rankingsJson | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $dataDir "ship-rankings.json") -Encoding UTF8

Write-Host "Generated $($ships.Count) ships."

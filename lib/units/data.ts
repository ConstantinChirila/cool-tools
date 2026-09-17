/**
 * Unit definitions for the unit converter. Every category has one base unit;
 * a unit is described by how it maps onto that base:
 *
 *   linear:    base = x * factor
 *   affine:    base = x * factor + offset          (temperature scales)
 *   inverse:   base = factor / x                   (fuel economy, running pace)
 *
 * Factors are the exact legal definitions where one exists (inch = 25.4 mm,
 * pound = 0.45359237 kg, UK gallon = 4.54609 L). Bare words default to UK
 * usage: "pint", "gallon", "mpg" and "ton" are imperial; US variants are
 * explicit.
 */

export type UnitGroupId = "everyday" | "science" | "digital" | "health";

export interface UnitGroup {
  id: UnitGroupId;
  label: string;
  /** Sticker fill used for the active category and the result panel. */
  bg: string;
}

export interface Unit {
  id: string;
  name: string;
  /** Short symbol shown next to values. */
  sym: string;
  /** Multiplier to the base unit, or the constant k in base = k / x for inverse units. */
  factor: number;
  /** Added after the factor, in base units. */
  offset?: number;
  /** Reciprocal relationship with the base. */
  inverse?: boolean;
  /** Display as m:ss instead of a decimal (running pace). */
  format?: "minsec";
  /** Extra spellings the phrase parser and picker accept, beyond name and symbol. */
  aliases: readonly string[];
}

export interface UnitCategory {
  id: string;
  name: string;
  group: UnitGroupId;
  /** Symbol of the base unit, for display only. */
  base: string;
  /** What the category opens with. */
  preset: { from: string; to: string; value: number };
  /** Common pairs offered as one-click chips. */
  pairs: readonly (readonly [string, string])[];
  units: readonly Unit[];
}

export const groups: readonly UnitGroup[] = [
  { id: "everyday", label: "Everyday", bg: "bg-yellow" },
  { id: "science", label: "Science", bg: "bg-pink" },
  { id: "digital", label: "Digital", bg: "bg-sky" },
  { id: "health", label: "Health", bg: "bg-mint" },
];

function u(
  id: string,
  name: string,
  sym: string,
  factor: number,
  aliases: readonly string[] = [],
  extra: Pick<Unit, "offset" | "inverse" | "format"> = {},
): Unit {
  return { id, name, sym, factor, aliases, ...extra };
}

export const categories: readonly UnitCategory[] = [
  {
    id: "length",
    name: "Length",
    group: "everyday",
    base: "m",
    preset: { from: "mi", to: "km", value: 26.2 },
    pairs: [["mi","km"],["ft","m"],["in","cm"],["km","mi"],["yd","m"],["nmi","km"]],
    units: [
      u("mm","Millimetre","mm",0.001,["millimeter"]),
      u("cm","Centimetre","cm",0.01,["centimeter"]),
      u("m","Metre","m",1,["meter","metres","meters"]),
      u("km","Kilometre","km",1000,["kilometer","kms"]),
      u("um","Micrometre","µm",1e-6,["micron","microns","micrometer","um"]),
      u("nm","Nanometre","nm",1e-9,["nanometer"]),
      u("ang","Ångström","Å",1e-10,["angstrom","angstroms"]),
      u("in","Inch","in",0.0254,["inch","inches"]),
      u("ft","Foot","ft",0.3048,["foot","feet"]),
      u("yd","Yard","yd",0.9144,["yard","yards"]),
      u("mi","Mile","mi",1609.344,["mile","miles"]),
      u("nmi","Nautical mile","nmi",1852,["nautical mile","nautical miles"]),
      u("thou","Thou (mil)","thou",2.54e-5,["mil","thousandth of an inch"]),
      u("hand","Hand","hh",0.1016,["hands"]),
      u("fathom","Fathom","ftm",1.8288,["fathoms"]),
      u("chain","Chain","ch",20.1168,["chains"]),
      u("furlong","Furlong","fur",201.168,["furlongs"]),
      u("league","League","lea",4828.032,["leagues"]),
      u("rod","Rod","rd",5.0292,["rods","pole","poles"]),
      u("au","Astronomical unit","AU",149597870700,["astronomical unit","astronomical units"]),
      u("ly","Light-year","ly",9460730472580800,["light year","light years","lightyear"]),
      u("pc","Parsec","pc",3.085677581491367e16,["parsecs"]),
    ],
  },
  {
    id: "area",
    name: "Area",
    group: "everyday",
    base: "m²",
    preset: { from: "acre", to: "ha", value: 1 },
    pairs: [["acre","ha"],["sqft","m2"],["ha","acre"],["sqmi","km2"],["m2","sqft"]],
    units: [
      u("mm2","Square millimetre","mm²",1e-6,["sq mm","square millimeter"]),
      u("cm2","Square centimetre","cm²",1e-4,["sq cm","square centimeter"]),
      u("m2","Square metre","m²",1,["sq m","sqm","square meter","square metres","square meters"]),
      u("ha","Hectare","ha",1e4,["hectares"]),
      u("km2","Square kilometre","km²",1e6,["sq km","sqkm","square kilometer"]),
      u("sqin","Square inch","in²",0.00064516,["sq in","sqin","square inches"]),
      u("sqft","Square foot","ft²",0.09290304,["sq ft","sqft","square feet"]),
      u("sqyd","Square yard","yd²",0.83612736,["sq yd","sqyd","square yards"]),
      u("acre","Acre","ac",4046.8564224,["acres"]),
      u("sqmi","Square mile","mi²",2589988.110336,["sq mi","sqmi","square miles"]),
      u("are","Are","a",100,["ares"]),
      u("rood","Rood","rood",1011.7141056,["roods"]),
      u("perch","Perch","perch",25.29285264,["perches","square perch"]),
    ],
  },
  {
    id: "volume",
    name: "Volume",
    group: "everyday",
    base: "L",
    preset: { from: "pt_uk", to: "ml", value: 1 },
    pairs: [["pt_uk","ml"],["gal_uk","l"],["cup_us","ml"],["floz_us","ml"],["l","gal_us"],["pt_uk","pt_us"]],
    units: [
      u("ml","Millilitre","ml",0.001,["milliliter","cc"]),
      u("cl","Centilitre","cl",0.01,["centiliter"]),
      u("dl","Decilitre","dl",0.1,["deciliter"]),
      u("l","Litre","L",1,["liter","litres","liters","ltr"]),
      u("m3","Cubic metre","m³",1000,["cubic meter","cubic metres","cu m"]),
      u("cm3","Cubic centimetre","cm³",0.001,["cubic centimeter"]),
      u("mm3","Cubic millimetre","mm³",1e-6,[]),
      u("tsp_metric","Teaspoon (metric)","tsp",0.005,["teaspoon","teaspoons","metric teaspoon"]),
      u("tbsp_metric","Tablespoon (metric)","tbsp",0.015,["tablespoon","tablespoons","metric tablespoon"]),
      u("cup_metric","Cup (metric)","cup",0.25,["metric cup"]),
      u("tsp_us","Teaspoon (US)","tsp US",0.00492892159375,["us teaspoon","us tsp"]),
      u("tbsp_us","Tablespoon (US)","tbsp US",0.01478676478125,["us tablespoon","us tbsp"]),
      u("floz_us","Fluid ounce (US)","fl oz US",0.0295735295625,["us fl oz","us fluid ounce","floz us"]),
      u("cup_us","Cup (US)","cup US",0.2365882365,["cup","cups","us cup","us cups"]),
      u("pt_us","Pint (US)","pt US",0.473176473,["us pint","us pints"]),
      u("qt_us","Quart (US)","qt US",0.946352946,["us quart","us quarts"]),
      u("gal_us","Gallon (US)","gal US",3.785411784,["us gallon","us gallons","us gal"]),
      u("floz_uk","Fluid ounce (UK)","fl oz",0.0284130625,["fl oz","fluid ounce","fluid ounces","floz","uk fl oz","imperial fluid ounce"]),
      u("pt_uk","Pint (UK)","pt",0.56826125,["pint","pints","uk pint","uk pints","imperial pint"]),
      u("qt_uk","Quart (UK)","qt",1.1365225,["quart","quarts","uk quart","imperial quart"]),
      u("gal_uk","Gallon (UK)","gal",4.54609,["gallon","gallons","uk gallon","uk gallons","imperial gallon","uk gal"]),
      u("bbl","Oil barrel","bbl",158.987294928,["barrel","barrels","oil barrel","oil barrels"]),
      u("in3","Cubic inch","in³",0.016387064,["cubic inch","cubic inches","cu in"]),
      u("ft3","Cubic foot","ft³",28.316846592,["cubic foot","cubic feet","cu ft"]),
      u("yd3","Cubic yard","yd³",764.554857984,["cubic yard","cubic yards","cu yd"]),
      u("bushel","Bushel (US)","bu",35.23907016688,["bushel","bushels"]),
      u("shot","Shot (UK 25 ml)","shot",0.025,["shots","single measure"]),
    ],
  },
  {
    id: "mass",
    name: "Mass & weight",
    group: "everyday",
    base: "kg",
    preset: { from: "st", to: "kg", value: 11 },
    pairs: [["st","kg"],["kg","lb"],["lb","kg"],["oz","g"],["g","oz"],["t","ton_uk"]],
    units: [
      u("ug","Microgram","µg",1e-9,["ug","mcg","micrograms"]),
      u("mg","Milligram","mg",1e-6,["milligrams"]),
      u("g","Gram","g",0.001,["grams","gramme","grammes"]),
      u("kg","Kilogram","kg",1,["kilo","kilos","kilograms","kgs"]),
      u("t","Tonne","t",1000,["tonnes","metric ton","metric tons"]),
      u("oz","Ounce","oz",0.028349523125,["ounce","ounces"]),
      u("lb","Pound","lb",0.45359237,["pound","pounds","lbs"]),
      u("st","Stone","st",6.35029318,["stone","stones"]),
      u("ton_us","Short ton (US)","ton US",907.18474,["short ton","us ton","us tons"]),
      u("ton_uk","Long ton (UK)","ton",1016.0469088,["long ton","ton","tons","imperial ton"]),
      u("cwt_uk","Hundredweight (UK)","cwt",50.80234544,["hundredweight","cwt uk"]),
      u("cwt_us","Hundredweight (US)","cwt US",45.359237,["us hundredweight","cwt us"]),
      u("gr","Grain","gr",6.479891e-5,["grain","grains"]),
      u("ct","Carat","ct",0.0002,["carat","carats"]),
      u("ozt","Troy ounce","oz t",0.0311034768,["troy ounce","troy ounces","troy oz"]),
      u("dr","Dram","dr",0.0017718451953125,["dram","drams"]),
      u("slug","Slug","slug",14.5939029372,["slugs"]),
      u("da","Dalton","Da",1.6605390666e-27,["dalton","daltons","amu","atomic mass unit"]),
    ],
  },
  {
    id: "temp",
    name: "Temperature",
    group: "everyday",
    base: "K",
    preset: { from: "c", to: "f", value: 21 },
    pairs: [["c","f"],["f","c"],["c","k"],["k","c"],["f","k"]],
    units: [
      u("c","Celsius","°C",1,["celsius","centigrade","c","C","degc"],{ offset: 273.15 }),
      u("f","Fahrenheit","°F",5/9,["fahrenheit","f","F","degf"],{ offset: 273.15 - 32 * 5 / 9 }),
      u("k","Kelvin","K",1,["kelvin","kelvins","k"]),
      u("r","Rankine","°R",5/9,["rankine","ra"]),
      u("re","Réaumur","°Ré",1.25,["reaumur","réaumur"],{ offset: 273.15 }),
    ],
  },
  {
    id: "speed",
    name: "Speed & pace",
    group: "everyday",
    base: "m/s",
    preset: { from: "mph", to: "kmh", value: 70 },
    pairs: [["mph","kmh"],["kmh","mph"],["minkm","minmi"],["minkm","kmh"],["kn","mph"],["ms","kmh"]],
    units: [
      u("ms","Metre per second","m/s",1,["meters per second","metres per second","mps"]),
      u("kmh","Kilometre per hour","km/h",1000/3600,["kph","kmph","kmh","km per hour","kilometres per hour","kilometers per hour"]),
      u("mph","Mile per hour","mph",0.44704,["miles per hour","mi/h"]),
      u("fts","Foot per second","ft/s",0.3048,["fps","feet per second"]),
      u("kn","Knot","kn",1852/3600,["knot","knots","kt","kts"]),
      u("kms","Kilometre per second","km/s",1000,["kilometres per second","kilometers per second"]),
      u("mach","Mach (sea level)","Ma",340.29,["mach"]),
      u("c","Speed of light","c",299792458,["speed of light","lightspeed"]),
      u("minkm","Minutes per km (pace)","min/km",1000/60,["min per km","pace per km","minutes per kilometre","minutes per kilometer"],{ inverse: true, format: "minsec" }),
      u("minmi","Minutes per mile (pace)","min/mi",1609.344/60,["min per mile","pace per mile","minutes per mile","min/mile"],{ inverse: true, format: "minsec" }),
    ],
  },
  {
    id: "time",
    name: "Time",
    group: "everyday",
    base: "s",
    preset: { from: "wk", to: "d", value: 6 },
    pairs: [["h","min"],["d","h"],["wk","d"],["yr","d"],["ms","s"],["mo","wk"]],
    units: [
      u("ns","Nanosecond","ns",1e-9,["nanoseconds"]),
      u("us","Microsecond","µs",1e-6,["us","microseconds"]),
      u("ms","Millisecond","ms",1e-3,["milliseconds","millis"]),
      u("s","Second","s",1,["sec","secs","second","seconds"]),
      u("min","Minute","min",60,["minute","minutes","mins"]),
      u("h","Hour","h",3600,["hr","hrs","hour","hours"]),
      u("d","Day","d",86400,["day","days"]),
      u("wk","Week","wk",604800,["week","weeks","w"]),
      u("fn","Fortnight","fn",1209600,["fortnight","fortnights"]),
      u("mo","Month (average)","mo",2629746,["month","months"]),
      u("yr","Year (Gregorian)","yr",31556952,["year","years","y"]),
      u("dec","Decade","dec",315569520,["decade","decades"]),
      u("cent","Century","c.",3155695200,["century","centuries"]),
      u("mill","Millennium","ka",31556952000,["millennium","millennia"]),
    ],
  },
  {
    id: "fuel",
    name: "Fuel economy",
    group: "everyday",
    base: "L/100km",
    preset: { from: "mpg_uk", to: "l100km", value: 45 },
    pairs: [["mpg_uk","l100km"],["l100km","mpg_uk"],["mpg_us","l100km"],["mpg_uk","mpg_us"],["kml","mpg_uk"],["l100km","kml"]],
    units: [
      u("l100km","Litres per 100 km","L/100km",1,["l/100km","l per 100km","litres per 100 km","liters per 100 km","l100km","l/100 km"]),
      u("kml","Kilometres per litre","km/L",100,["km per litre","km per liter","kmpl","km/l"],{ inverse: true }),
      u("mpg_uk","Miles per gallon (UK)","mpg UK",100*4.54609/1.609344,["mpg","mpg uk","uk mpg","imperial mpg","miles per gallon","miles per imperial gallon"],{ inverse: true }),
      u("mpg_us","Miles per gallon (US)","mpg US",100*3.785411784/1.609344,["mpg us","us mpg","miles per us gallon"],{ inverse: true }),
      u("mipl","Miles per litre","mi/L",100/1.609344,["miles per litre","miles per liter","mi/l"],{ inverse: true }),
      u("gal100mi_us","Gallons per 100 miles (US)","gal/100mi US",3.785411784/1.609344,["gal per 100 miles us","us gallons per 100 miles"]),
      u("gal100mi_uk","Gallons per 100 miles (UK)","gal/100mi",4.54609/1.609344,["gal per 100 miles","gallons per 100 miles"]),
    ],
  },
  {
    id: "pressure",
    name: "Pressure",
    group: "science",
    base: "Pa",
    preset: { from: "psi", to: "bar", value: 32 },
    pairs: [["psi","bar"],["bar","psi"],["atm","kpa"],["mmhg","kpa"],["psi","kpa"],["inhg","mbar"]],
    units: [
      u("pa","Pascal","Pa",1,["pascal","pascals"]),
      u("hpa","Hectopascal","hPa",100,["hectopascal","hectopascals"]),
      u("kpa","Kilopascal","kPa",1e3,["kilopascal","kilopascals"]),
      u("mpa","Megapascal","MPa",1e6,["megapascal","megapascals"]),
      u("bar","Bar","bar",1e5,["bars"]),
      u("mbar","Millibar","mbar",100,["millibar","millibars"]),
      u("atm","Atmosphere","atm",101325,["atmosphere","atmospheres"]),
      u("at","Technical atmosphere","at",98066.5,["technical atmosphere","kgf/cm2","kgf per cm2"]),
      u("psi","Pound per square inch","psi",6894.757293168,["pounds per square inch","lbf/in2"]),
      u("ksi","Kilopound per square inch","ksi",6894757.293168,[]),
      u("torr","Torr","Torr",101325/760,["torrs"]),
      u("mmhg","Millimetre of mercury","mmHg",133.322387415,["mm hg","mm of mercury","millimetres of mercury"]),
      u("inhg","Inch of mercury","inHg",3386.389,["in hg","inches of mercury"]),
      u("mh2o","Metre of water","mH₂O",9806.65,["mh2o","metres of water","meters of water"]),
      u("inh2o","Inch of water","inH₂O",249.08891,["inh2o","inches of water"]),
    ],
  },
  {
    id: "energy",
    name: "Energy",
    group: "science",
    base: "J",
    preset: { from: "kcal", to: "kj", value: 500 },
    pairs: [["kcal","kj"],["kwh","mj"],["btu","kj"],["kj","kcal"],["kwh","btu"],["ev","j"]],
    units: [
      u("j","Joule","J",1,["joule","joules"]),
      u("kj","Kilojoule","kJ",1e3,["kilojoule","kilojoules"]),
      u("mj","Megajoule","MJ",1e6,["megajoule","megajoules"]),
      u("gj","Gigajoule","GJ",1e9,["gigajoule","gigajoules"]),
      u("wh","Watt-hour","Wh",3600,["watt hour","watt hours"]),
      u("kwh","Kilowatt-hour","kWh",3.6e6,["kilowatt hour","kilowatt hours","unit of electricity","units of electricity"]),
      u("mwh","Megawatt-hour","MWh",3.6e9,["megawatt hour","megawatt hours"]),
      u("cal","Calorie (small)","cal",4.184,["calorie","calories","gram calorie"]),
      u("kcal","Kilocalorie","kcal",4184,["kilocalorie","kilocalories","food calorie","food calories","Cal"]),
      u("btu","British thermal unit","BTU",1055.05585262,["btus","british thermal unit","british thermal units"]),
      u("therm","Therm (UK)","thm",105505585.257348,["therms"]),
      u("ftlbf","Foot-pound","ft·lbf",1.3558179483314004,["ft lb","ft-lb","ft lbf","foot pound","foot pounds","ftlb"]),
      u("ev","Electronvolt","eV",1.602176634e-19,["electronvolt","electronvolts","electron volt"]),
      u("erg","Erg","erg",1e-7,["ergs"]),
      u("ttnt","Ton of TNT","t TNT",4.184e9,["ton of tnt","tons of tnt","tnt"]),
      u("hph","Horsepower-hour","hp·h",2684519.5376962,["horsepower hour","horsepower hours"]),
    ],
  },
  {
    id: "power",
    name: "Power",
    group: "science",
    base: "W",
    preset: { from: "hp", to: "kw", value: 150 },
    pairs: [["hp","kw"],["kw","hp"],["ps","hp"],["btuh","kw"],["kw","ps"],["w","btuh"]],
    units: [
      u("w","Watt","W",1,["watt","watts"]),
      u("kw","Kilowatt","kW",1e3,["kilowatt","kilowatts"]),
      u("mw","Megawatt","MW",1e6,["megawatt","megawatts"]),
      u("gw","Gigawatt","GW",1e9,["gigawatt","gigawatts"]),
      u("hp","Horsepower (mechanical)","hp",745.69987158227022,["horsepower","bhp","imperial horsepower"]),
      u("ps","Horsepower (metric)","PS",735.49875,["metric horsepower","cv","pferdestarke"]),
      u("btuh","BTU per hour","BTU/h",0.29307107017222,["btu/h","btu per hour","btuh","btu/hr"]),
      u("ftlbfs","Foot-pound per second","ft·lbf/s",1.3558179483314004,["ft lbf/s","foot pounds per second"]),
      u("cals","Calorie per second","cal/s",4.184,["calories per second"]),
      u("kcalh","Kilocalorie per hour","kcal/h",4184/3600,["kcal per hour","kilocalories per hour"]),
      u("tr","Ton of refrigeration","TR",3516.8528420667,["ton of refrigeration","tons of refrigeration","refrigeration ton"]),
    ],
  },
  {
    id: "force",
    name: "Force",
    group: "science",
    base: "N",
    preset: { from: "lbf", to: "n", value: 100 },
    pairs: [["lbf","n"],["n","lbf"],["kgf","n"],["kn","lbf"],["n","kgf"]],
    units: [
      u("n","Newton","N",1,["newton","newtons"]),
      u("kn","Kilonewton","kN",1e3,["kilonewton","kilonewtons"]),
      u("dyn","Dyne","dyn",1e-5,["dyne","dynes"]),
      u("lbf","Pound-force","lbf",4.4482216152605,["pound force","pounds force"]),
      u("kgf","Kilogram-force","kgf",9.80665,["kilogram force","kilopond","kp"]),
      u("kip","Kip","kip",4448.2216152605,["kips"]),
      u("pdl","Poundal","pdl",0.138254954376,["poundal","poundals"]),
      u("ozf","Ounce-force","ozf",0.27801385095378125,["ounce force"]),
    ],
  },
  {
    id: "torque",
    name: "Torque",
    group: "science",
    base: "N·m",
    preset: { from: "lbfft", to: "nm", value: 100 },
    pairs: [["lbfft","nm"],["nm","lbfft"],["kgfm","nm"],["lbfin","nm"],["nm","lbfin"]],
    units: [
      u("nm","Newton-metre","N·m",1,["Nm","newton metre","newton meter","newton metres","newton meters","n-m"]),
      u("knm","Kilonewton-metre","kN·m",1e3,["kNm","kilonewton metre"]),
      u("lbfft","Pound-foot","lbf·ft",1.3558179483314004,["lb ft","lb-ft","lbft","pound foot","pound feet","ft-lbs"]),
      u("lbfin","Pound-inch","lbf·in",0.1129848290276167,["lb in","lb-in","lbin","pound inch","inch pound","in-lb"]),
      u("kgfm","Kilogram-force metre","kgf·m",9.80665,["kgf m","kgm","kg m"]),
      u("ozfin","Ounce-inch","ozf·in",0.00706155183333,["oz in","ounce inch"]),
    ],
  },
  {
    id: "density",
    name: "Density",
    group: "science",
    base: "kg/m³",
    preset: { from: "gcm3", to: "kgm3", value: 1 },
    pairs: [["gcm3","kgm3"],["kgm3","lbft3"],["lbgal_uk","kgl"],["gml","lbgal_us"]],
    units: [
      u("kgm3","Kilogram per cubic metre","kg/m³",1,["kg/m3","kg per m3","kg per cubic metre"]),
      u("gcm3","Gram per cubic centimetre","g/cm³",1000,["g/cm3","g per cm3","g/cc"]),
      u("gml","Gram per millilitre","g/mL",1000,["g/ml","grams per millilitre"]),
      u("kgl","Kilogram per litre","kg/L",1000,["kg/l","kg per litre"]),
      u("gl","Gram per litre","g/L",1,["g/l","grams per litre"]),
      u("lbft3","Pound per cubic foot","lb/ft³",16.01846337396,["lb/ft3","pcf","pounds per cubic foot"]),
      u("lbin3","Pound per cubic inch","lb/in³",27679.9047102,["lb/in3","pounds per cubic inch"]),
      u("lbgal_us","Pound per US gallon","lb/gal US",119.8264273,["lb/gal us"]),
      u("lbgal_uk","Pound per UK gallon","lb/gal",99.77637266,["lb/gal","pounds per gallon"]),
      u("ozin3","Ounce per cubic inch","oz/in³",1729.99404,["oz/in3"]),
    ],
  },
  {
    id: "flow",
    name: "Flow rate",
    group: "science",
    base: "L/s",
    preset: { from: "gpm_uk", to: "lmin", value: 10 },
    pairs: [["gpm_uk","lmin"],["lmin","gpm_us"],["cfm","m3h"],["m3h","ls"],["ls","gpm_uk"]],
    units: [
      u("ls","Litre per second","L/s",1,["l/s","litres per second"]),
      u("lmin","Litre per minute","L/min",1/60,["l/min","lpm","litres per minute"]),
      u("lh","Litre per hour","L/h",1/3600,["l/h","litres per hour"]),
      u("m3s","Cubic metre per second","m³/s",1000,["m3/s","cumec","cumecs"]),
      u("m3h","Cubic metre per hour","m³/h",1000/3600,["m3/h","cubic metres per hour"]),
      u("gpm_us","US gallon per minute","gal/min US",3.785411784/60,["us gpm","gpm us","us gallons per minute"]),
      u("gpm_uk","UK gallon per minute","gal/min",4.54609/60,["gpm","gallons per minute","uk gpm"]),
      u("cfm","Cubic foot per minute","ft³/min",28.316846592/60,["cfm","cubic feet per minute","ft3/min"]),
      u("cfs","Cubic foot per second","ft³/s",28.316846592,["cfs","cusec","cubic feet per second","ft3/s"]),
    ],
  },
  {
    id: "accel",
    name: "Acceleration",
    group: "science",
    base: "m/s²",
    preset: { from: "g0", to: "ms2", value: 1 },
    pairs: [["g0","ms2"],["ms2","fts2"],["mphs","ms2"],["ms2","g0"]],
    units: [
      u("ms2","Metre per second squared","m/s²",1,["m/s2","m/s^2","meters per second squared","metres per second squared"]),
      u("g0","Standard gravity","g₀",9.80665,["g force","g-force","gs","standard gravity","gee","gees"]),
      u("fts2","Foot per second squared","ft/s²",0.3048,["ft/s2","ft/s^2","feet per second squared"]),
      u("galileo","Gal (cm/s²)","Gal",0.01,["cm/s2","galileo"]),
      u("kmhs","km/h per second","km/h/s",1000/3600,["kph per second"]),
      u("mphs","mph per second","mph/s",0.44704,["mph per second"]),
    ],
  },
  {
    id: "angle",
    name: "Angle",
    group: "science",
    base: "rad",
    preset: { from: "deg", to: "rad", value: 45 },
    pairs: [["deg","rad"],["rad","deg"],["deg","grad"],["turn","deg"],["arcmin","deg"]],
    units: [
      u("deg","Degree","°",Math.PI/180,["deg","degree","degrees"]),
      u("rad","Radian","rad",1,["radian","radians"]),
      u("grad","Gradian","gon",Math.PI/200,["gradian","gradians","gon","grad"]),
      u("arcmin","Arcminute","′",Math.PI/10800,["arcmin","arcminute","arcminutes","arc minute","moa"]),
      u("arcsec","Arcsecond","″",Math.PI/648000,["arcsec","arcsecond","arcseconds","arc second"]),
      u("turn","Turn","tr",2*Math.PI,["turns","revolution","revolutions","rev"]),
      u("mrad","Milliradian","mrad",0.001,["milliradian","milliradians"]),
      u("milnato","Mil (NATO)","mil (NATO)",2*Math.PI/6400,["nato mil","angular mil"]),
    ],
  },
  {
    id: "freq",
    name: "Frequency",
    group: "science",
    base: "Hz",
    preset: { from: "rpm", to: "hz", value: 3000 },
    pairs: [["rpm","hz"],["hz","rpm"],["mhz","ghz"],["rpm","rads"],["bpm","hz"]],
    units: [
      u("hz","Hertz","Hz",1,["hertz","per second","cycles per second"]),
      u("khz","Kilohertz","kHz",1e3,["kilohertz"]),
      u("mhz","Megahertz","MHz",1e6,["megahertz"]),
      u("ghz","Gigahertz","GHz",1e9,["gigahertz"]),
      u("rpm","Revolutions per minute","rpm",1/60,["revs per minute","revolutions per minute","rev/min"]),
      u("bpm","Beats per minute","bpm",1/60,["beats per minute"]),
      u("rads","Radians per second","rad/s",1/(2*Math.PI),["rad per second","radians per second"]),
    ],
  },
  {
    id: "data",
    name: "Data size",
    group: "digital",
    base: "B",
    preset: { from: "gb", to: "gib", value: 500 },
    pairs: [["gb","gib"],["mb","mib"],["tb","gb"],["mbit","mb"],["gib","gb"],["tb","tib"]],
    units: [
      u("bit","Bit","bit",0.125,["bits","b"]),
      u("nibble","Nibble","nibble",0.5,["nibbles"]),
      u("byte","Byte","B",1,["bytes"]),
      u("kb","Kilobyte","kB",1e3,["kilobyte","kilobytes","kbyte"]),
      u("mb","Megabyte","MB",1e6,["megabyte","megabytes","mb","meg","megs"]),
      u("gb","Gigabyte","GB",1e9,["gigabyte","gigabytes","gb","gig","gigs"]),
      u("tb","Terabyte","TB",1e12,["terabyte","terabytes","tb"]),
      u("pb","Petabyte","PB",1e15,["petabyte","petabytes"]),
      u("kib","Kibibyte","KiB",1024,["kibibyte","kibibytes"]),
      u("mib","Mebibyte","MiB",1048576,["mebibyte","mebibytes"]),
      u("gib","Gibibyte","GiB",1073741824,["gibibyte","gibibytes"]),
      u("tib","Tebibyte","TiB",1099511627776,["tebibyte","tebibytes"]),
      u("pib","Pebibyte","PiB",1125899906842624,["pebibyte","pebibytes"]),
      u("kbit","Kilobit","kbit",125,["kilobit","kilobits"]),
      u("mbit","Megabit","Mbit",125000,["megabit","megabits"]),
      u("gbit","Gigabit","Gbit",1.25e8,["gigabit","gigabits"]),
    ],
  },
  {
    id: "datarate",
    name: "Data transfer",
    group: "digital",
    base: "bit/s",
    preset: { from: "mbps", to: "mbs", value: 100 },
    pairs: [["mbps","mbs"],["mbs","mbps"],["gbps","mbs"],["kbps","kbs"],["gbps","gbs"]],
    units: [
      u("bps","Bit per second","bit/s",1,["bps","bits per second"]),
      u("kbps","Kilobit per second","kbit/s",1e3,["kbps","kbit/s","kilobits per second"]),
      u("mbps","Megabit per second","Mbit/s",1e6,["mbps","mbit/s","megabits per second"]),
      u("gbps","Gigabit per second","Gbit/s",1e9,["gbps","gbit/s","gigabits per second"]),
      u("bs","Byte per second","B/s",8,["bytes per second"]),
      u("kbs","Kilobyte per second","kB/s",8e3,["kb/s","kilobytes per second"]),
      u("mbs","Megabyte per second","MB/s",8e6,["mb/s","megabytes per second"]),
      u("gbs","Gigabyte per second","GB/s",8e9,["gb/s","gigabytes per second"]),
    ],
  },
  {
    id: "glucose",
    name: "Blood glucose",
    group: "health",
    base: "mmol/L",
    preset: { from: "mgdl", to: "mmoll", value: 100 },
    pairs: [["mgdl","mmoll"],["mmoll","mgdl"]],
    units: [
      u("mmoll","Millimoles per litre","mmol/L",1,["mmol","mmol/l","mmol per litre","glucose mmol"]),
      u("mgdl","Milligrams per decilitre","mg/dL",1/18.0156,["mg/dl","mg per dl","mgdl","glucose mg/dl"]),
    ],
  },
  {
    id: "cholesterol",
    name: "Cholesterol",
    group: "health",
    base: "mmol/L",
    preset: { from: "mgdl", to: "mmoll", value: 200 },
    pairs: [["mgdl","mmoll"],["mmoll","mgdl"]],
    units: [
      u("mmoll","Millimoles per litre","mmol/L",1,["cholesterol mmol","cholesterol mmol/l"]),
      u("mgdl","Milligrams per decilitre","mg/dL",1/38.67,["cholesterol mg/dl","cholesterol mgdl"]),
    ],
  },
  {
    id: "typography",
    name: "Typography",
    group: "digital",
    base: "m",
    preset: { from: "pt", to: "px", value: 12 },
    pairs: [["pt","px"],["px","pt"],["pt","typ_mm"],["pica","typ_mm"],["px","typ_mm"]],
    units: [
      u("pt","Point (DTP)","pt",0.0254/72,["point","points","dtp point","postscript point"]),
      u("px","Pixel (CSS, 96 dpi)","px",0.0254/96,["pixel","pixels","css pixel"]),
      u("pica","Pica","pc",0.0254/6,["picas"]),
      u("twip","Twip","twip",0.0254/1440,["twips"]),
      u("typ_mm","Millimetre","mm",0.001,[]),
      u("typ_cm","Centimetre","cm",0.01,[]),
      u("typ_in","Inch","in",0.0254,[]),
    ],
  },
  {
    id: "illuminance",
    name: "Illuminance",
    group: "science",
    base: "lx",
    preset: { from: "fc", to: "lux", value: 50 },
    pairs: [["fc","lux"],["lux","fc"],["phot","lux"]],
    units: [
      u("lux","Lux","lx",1,["lux","lumens per square metre","lm/m2"]),
      u("fc","Foot-candle","fc",10.7639104167,["foot candle","foot candles","footcandle","lm/ft2"]),
      u("phot","Phot","ph",10000,["phots"]),
      u("nox","Nox","nox",0.001,[]),
    ],
  },
  {
    id: "luminance",
    name: "Luminance",
    group: "science",
    base: "cd/m²",
    preset: { from: "nit", to: "fl", value: 300 },
    pairs: [["nit","fl"],["fl","nit"],["stilb","nit"]],
    units: [
      u("nit","Candela per square metre (nit)","cd/m²",1,["nit","nits","cd/m2","candela per square metre"]),
      u("stilb","Stilb","sb",10000,["stilbs"]),
      u("fl","Foot-lambert","fL",3.4262590996,["foot lambert","foot lamberts","footlambert"]),
      u("asb","Apostilb","asb",1/Math.PI,["apostilb","apostilbs","blondel"]),
      u("lambert","Lambert","L",10000/Math.PI,["lamberts"]),
    ],
  },
  {
    id: "viscosity",
    name: "Dynamic viscosity",
    group: "science",
    base: "Pa·s",
    preset: { from: "cp", to: "mpas", value: 1 },
    pairs: [["cp","mpas"],["p","pas"],["cp","pas"]],
    units: [
      u("pas","Pascal-second","Pa·s",1,["pascal second","pascal seconds","pa s","pa.s"]),
      u("mpas","Millipascal-second","mPa·s",0.001,["millipascal second","mpa s"]),
      u("p","Poise","P",0.1,["poise"]),
      u("cp","Centipoise","cP",0.001,["centipoise","centipoises"]),
      u("lbfts","Pound per foot-second","lb/(ft·s)",1.48816394,["lb/ft s","lb/(ft s)"]),
      u("reyn","Reyn (lbf·s/in²)","reyn",6894.75729,["reyns","lbf s/in2"]),
    ],
  },
  {
    id: "kinviscosity",
    name: "Kinematic viscosity",
    group: "science",
    base: "m²/s",
    preset: { from: "cst", to: "mm2s", value: 1 },
    pairs: [["cst","mm2s"],["st","m2s"],["ft2s","cst"]],
    units: [
      u("m2s","Square metre per second","m²/s",1,["m2/s"]),
      u("mm2s","Square millimetre per second","mm²/s",1e-6,["mm2/s"]),
      u("st","Stokes","St",1e-4,["stokes"]),
      u("cst","Centistokes","cSt",1e-6,["centistokes","centistoke"]),
      u("ft2s","Square foot per second","ft²/s",0.09290304,["ft2/s"]),
    ],
  },
  {
    id: "absorbeddose",
    name: "Absorbed dose",
    group: "science",
    base: "Gy",
    preset: { from: "rad", to: "gy", value: 100 },
    pairs: [["rad","gy"],["gy","rad"],["mgy","mrad"]],
    units: [
      u("gy","Gray","Gy",1,["gray","grays"]),
      u("mgy","Milligray","mGy",0.001,["milligray"]),
      u("ugy","Microgray","µGy",1e-6,["microgray","ugy"]),
      u("rad","Rad (radiation)","rad",0.01,["rads"]),
      u("mrad","Millirad","mrad",1e-5,["millirad","millirads"]),
    ],
  },
  {
    id: "dose",
    name: "Equivalent dose",
    group: "science",
    base: "Sv",
    preset: { from: "msv", to: "mrem", value: 2.4 },
    pairs: [["msv","mrem"],["rem","sv"],["usv","mrem"]],
    units: [
      u("sv","Sievert","Sv",1,["sievert","sieverts"]),
      u("msv","Millisievert","mSv",0.001,["millisievert","millisieverts"]),
      u("usv","Microsievert","µSv",1e-6,["microsievert","microsieverts","usv"]),
      u("rem","Rem","rem",0.01,["rems","roentgen equivalent man"]),
      u("mrem","Millirem","mrem",1e-5,["millirem","millirems"]),
    ],
  },
  {
    id: "radioactivity",
    name: "Radioactivity",
    group: "science",
    base: "Bq",
    preset: { from: "ci", to: "gbq", value: 1 },
    pairs: [["ci","gbq"],["mci","mbq"],["bq","dpm"]],
    units: [
      u("bq","Becquerel","Bq",1,["becquerel","becquerels"]),
      u("kbq","Kilobecquerel","kBq",1e3,["kilobecquerel"]),
      u("mbq","Megabecquerel","MBq",1e6,["megabecquerel"]),
      u("gbq","Gigabecquerel","GBq",1e9,["gigabecquerel"]),
      u("ci","Curie","Ci",3.7e10,["curie","curies"]),
      u("mci","Millicurie","mCi",3.7e7,["millicurie"]),
      u("uci","Microcurie","µCi",3.7e4,["microcurie","uci"]),
      u("dpm","Disintegrations per minute","dpm",1/60,["disintegrations per minute"]),
    ],
  },
  {
    id: "charge",
    name: "Electric charge",
    group: "science",
    base: "C",
    preset: { from: "mah", to: "c", value: 5000 },
    pairs: [["mah","c"],["ah","c"],["mah","ah"],["c","e"]],
    units: [
      u("c","Coulomb","C",1,["coulomb","coulombs"]),
      u("kc","Kilocoulomb","kC",1e3,["kilocoulomb"]),
      u("mc","Millicoulomb","mC",1e-3,["millicoulomb"]),
      u("uc","Microcoulomb","µC",1e-6,["microcoulomb","uc"]),
      u("ah","Ampere-hour","Ah",3600,["amp hour","amp hours","ampere hour","ampere hours"]),
      u("mah","Milliampere-hour","mAh",3.6,["milliamp hour","milliamp hours","milliampere hour"]),
      u("e","Elementary charge","e",1.602176634e-19,["elementary charge","electron charge"]),
      u("faraday","Faraday","F",96485.33212,["faradays"]),
    ],
  },
  {
    id: "magnetic",
    name: "Magnetic flux density",
    group: "science",
    base: "T",
    preset: { from: "g", to: "mt", value: 1 },
    pairs: [["g","mt"],["t","g"],["ut","mg"],["nt","gamma"]],
    units: [
      u("t","Tesla","T",1,["tesla","teslas"]),
      u("mt","Millitesla","mT",1e-3,["millitesla"]),
      u("ut","Microtesla","µT",1e-6,["microtesla","ut"]),
      u("nt","Nanotesla","nT",1e-9,["nanotesla"]),
      u("g","Gauss","G",1e-4,["gauss"]),
      u("mg","Milligauss","mG",1e-7,["milligauss"]),
      u("gamma","Gamma","γ",1e-9,["gammas"]),
    ],
  },
];

export const unitCount = categories.reduce((n, c) => n + c.units.length, 0);

export function getCategory(id: string): UnitCategory | undefined {
  return categories.find((c) => c.id === id);
}

export function getUnit(category: UnitCategory, id: string): Unit | undefined {
  return category.units.find((unit) => unit.id === id);
}

export function getGroup(id: UnitGroupId): UnitGroup {
  const group = groups.find((g) => g.id === id);
  if (!group) throw new Error(`Unknown unit group "${id}"`);
  return group;
}

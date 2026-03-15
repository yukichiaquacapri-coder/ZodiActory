import express from 'express';
import swisseph from 'swisseph';
import cors from 'cors';

const app = express();
app.use(cors());

const signs = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];
const elements = ["火", "地", "風", "水", "火", "地", "風", "水", "火", "地", "風", "水"];

// エッセンシャル・ディグニティの定義
const dignityRules = {
    "牡羊座": { domicile: "火星", exalt: "太陽", detriment: "金星", fall: "なし" },
    "牡牛座": { domicile: "金星", exalt: "月",   detriment: "火星", fall: "なし" },
    "双子座": { domicile: "水星", exalt: "なし", detriment: "木星", fall: "なし" },
    "蟹座":   { domicile: "月",   exalt: "木星", detriment: "土星", fall: "火星" },
    "獅子座": { domicile: "太陽", exalt: "なし", detriment: "土星", fall: "なし" },
    "乙女座": { domicile: "水星", exalt: "水星", detriment: "木星", fall: "金星" },
    "天秤座": { domicile: "金星", exalt: "土星", detriment: "火星", fall: "太陽" },
    "蠍座":   { domicile: "冥王星(火星)", exalt: "なし", detriment: "金星", fall: "月" },
    "射手座": { domicile: "木星", exalt: "なし", detriment: "水星", fall: "なし" },
    "山羊座": { domicile: "土星", exalt: "火星", detriment: "月",   fall: "木星" },
    "水瓶座": { domicile: "天王星(土星)", exalt: "なし", detriment: "太陽", fall: "なし" },
    "魚座":   { domicile: "海王星(木星)", exalt: "金星", detriment: "水星", fall: "水星" }
};

// トリプリシティ（ドロセウス方式：昼、夜）
const triplicityRules = {
    "火": { day: "太陽", night: "木星" },
    "地": { day: "金星", night: "月" },
    "風": { day: "土星", night: "水星" },
    "水": { day: "金星", night: "火星" }
};

app.get('/api/horoscope', (req, res) => {
    const { date, time, lat, lng, offset } = req.query;
    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, min] = time.split(':').map(Number);
        const ut = (hour + min / 60) + (parseFloat(offset) / 60);
        const jd = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);
        
        const houses = swisseph.swe_houses(jd, parseFloat(lat), parseFloat(lng), 'P');
        const asc = houses.ascendant;
        const mc = houses.mc;

        // 昼夜判定（太陽が地平線より上か）
        const sunData = swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SPEED);
        const isDay = (sunData.longitude > (asc + 180) % 360) === false; 

        const getPlanetInfo = (id, name) => {
            const res = swisseph.swe_calc_ut(jd, id, swisseph.SEFLG_SPEED);
            const long = res.longitude;
            const signIdx = Math.floor(long / 30);
            const signName = signs[signIdx];
            const element = elements[signIdx];
            const rules = dignityRules[signName];
            
            let score = 0;
            let status = [];

            if (rules.domicile.includes(name)) { score += 5; status.push("Domicile"); }
            if (rules.exalt.includes(name)) { score += 4; status.push("Exalt"); }
            
            const triRuler = isDay ? triplicityRules[element].day : triplicityRules[element].night;
            if (triRuler === name) { score += 3; status.push("Triplicity"); }

            if (rules.detriment.includes(name)) { score -= 5; status.push("Detriment"); }
            if (rules.fall.includes(name)) { score -= 4; status.push("Fall"); }

            if (score === 0) status.push("Peregrine");

            return {
                pos: `${signName} ${(long % 30).toFixed(2)}°${res.distanceSpeed < 0 ? "(R)" : ""}`,
                score,
                status: status.join("/")
            };
        };

        // パート・オブ・フォーチュン (PoF)
        const moonLong = swisseph.swe_calc_ut(jd, swisseph.SE_MOON, 0).longitude;
        let pof = isDay ? (asc + moonLong - sunData.longitude) : (asc + sunData.longitude - moonLong);
        pof = (pof + 360) % 360;

        res.json({
            sect: isDay ? "昼チャート" : "夜チャート",
            sun: getPlanetInfo(swisseph.SE_SUN, "太陽"),
            moon: getPlanetInfo(swisseph.SE_MOON, "月"),
            mars: getPlanetInfo(swisseph.SE_MARS, "火星"),
            pof: `${signs[Math.floor(pof / 30)]} ${(pof % 30).toFixed(2)}°`,
            asc: `${signs[Math.floor(asc / 30)]} ${(asc % 30).toFixed(2)}°`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0');

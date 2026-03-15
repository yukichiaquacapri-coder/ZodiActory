import express from 'express';
import swisseph from 'swisseph';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// HTMLファイルを表示できるようにする
app.use(express.static(__dirname));

app.get('/api/horoscope', (req, res) => {
    const { date, time, lat, lng } = req.query;
    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, min] = time.split(':').map(Number);
        const ut = hour + min / 60;
        
        // スイス・エフェメリスによる精密計算
        const jd = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);
        const signs = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];

        const getPos = (body) => {
            const result = swisseph.swe_calc_ut(jd, body, swisseph.SEFLG_SPEED);
            const long = result.longitude;
            const retro = result.distanceSpeed < 0 ? " (R)" : ""; // 逆行判定
            return `${signs[Math.floor(long / 30)]} ${(long % 30).toFixed(2)}°${retro}`;
        };

        // ASC（ハウス）の計算
        const houses = swisseph.swe_houses(jd, parseFloat(lat), parseFloat(lng), 'P');

        res.json({
            sunPos: getPos(swisseph.SE_SUN),
            moonPos: getPos(swisseph.SE_MOON),
            marsPos: getPos(swisseph.SE_MARS),
            ascPos: `${signs[Math.floor(houses.ascendant / 30)]} ${(houses.ascendant % 30).toFixed(2)}°`
        });
    } catch (e) {
        res.status(500).json({ error: "Calculation Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live on port ${PORT}`);
});

import express from 'express';
import swisseph from 'swisseph';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; // npm install cors が必要になるかもしれません
app.use(cors()); // これでどこからの呼び出しも許可されます

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// フロントエンドファイルを公開
app.use(express.static(__dirname));

app.get('/api/horoscope', (req, res) => {
    // index.htmlから送られてくる時差(offset)を受け取る
    const { date, time, lat, lng, offset } = req.query;
    
    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, min] = time.split(':').map(Number);
        
        // ユーザーの時差を考慮して世界標準時(UT)に変換
        // 例: 日本(JST)なら offset は -540 なので、(-540/60) = -9時間を足してUTにする
        const ut = (hour + min / 60) + (parseFloat(offset) / 60);
        
        const jd = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);
        const signs = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];

        // ハウス計算（プラシーダス法）
        const houses = swisseph.swe_houses(jd, parseFloat(lat), parseFloat(lng), 'P');
        const asc = houses.ascendant;

        const getPos = (body) => {
            const result = swisseph.swe_calc_ut(jd, body, swisseph.SEFLG_SPEED);
            const long = result.longitude;
            const retro = result.distanceSpeed < 0 ? " (R)" : "";
            return `${signs[Math.floor(long / 30)]} ${(long % 30).toFixed(2)}°${retro}`;
        };

        res.json({
            sunPos: getPos(swisseph.SE_SUN),
            moonPos: getPos(swisseph.SE_MOON),
            marsPos: getPos(swisseph.SE_MARS),
            ascPos: `${signs[Math.floor(asc / 30)]} ${(asc % 30).toFixed(2)}°`
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "計算に失敗しました" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

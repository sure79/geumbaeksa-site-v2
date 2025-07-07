const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 업로드 디렉토리 생성
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// 데이터 파일 경로
const dataFile = './data/branches.json';
const slidesFile = './data/slides.json';

// 데이터 디렉토리 생성
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// 초기 데이터 설정
if (!fs.existsSync(dataFile)) {
    const initialData = {
        branches: [
            {
                id: 1,
                name: "강남점",
                address: "서울특별시 강남구 테헤란로 123",
                phone: "02-1234-5678",
                hours: "평일 9:00-18:00, 토요일 9:00-15:00",
                image: "/uploads/default-branch.jpg",
                description: "강남 최고의 금 매입 전문점입니다. 공정한 시세와 친절한 서비스로 고객만족을 최우선으로 합니다.",
                features: ["24K 금 전문 매입", "실시간 시세 적용", "당일 현금 지급", "무료 감정"]
            },
            {
                id: 2,
                name: "홍대점",
                address: "서울특별시 마포구 홍익로 456",
                phone: "02-2345-6789",
                hours: "평일 10:00-19:00, 토요일 10:00-16:00",
                image: "/uploads/default-branch.jpg",
                description: "홍대 젊은 거리에 위치한 신뢰할 수 있는 금 매입 전문점입니다.",
                features: ["금 반지/목걸이 전문", "학생 할인 혜택", "온라인 시세 확인", "안전한 거래"]
            }
        ]
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
}

// 슬라이드 초기 데이터 설정
if (!fs.existsSync(slidesFile)) {
    const initialSlides = {
        slides: [
            {
                id: 1,
                image: "/uploads/default-slide1.jpg",
                title: "최고가 매입 보장",
                description: "시중 최고가로 귀하의 금을 매입해드립니다",
                active: true
            },
            {
                id: 2,
                image: "/uploads/default-slide2.jpg",
                title: "당일 현금 지급",
                description: "감정 후 즉시 현금으로 지급해드립니다",
                active: true
            },
            {
                id: 3,
                image: "/uploads/default-slide3.jpg",
                title: "전문 감정사 상주",
                description: "정확한 감정을 위한 전문가가 항상 대기합니다",
                active: true
            }
        ]
    };
    fs.writeFileSync(slidesFile, JSON.stringify(initialSlides, null, 2));
}

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 데이터 읽기 함수
function readData() {
    try {
        const data = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { branches: [] };
    }
}

// 데이터 쓰기 함수
function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// 슬라이드 데이터 읽기 함수
function readSlides() {
    try {
        const data = fs.readFileSync(slidesFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { slides: [] };
    }
}

// 슬라이드 데이터 쓰기 함수
function writeSlides(data) {
    fs.writeFileSync(slidesFile, JSON.stringify(data, null, 2));
}

// API 라우트

// 모든 지점 조회
app.get('/api/branches', (req, res) => {
    const data = readData();
    res.json(data.branches);
});

// 특정 지점 조회
app.get('/api/branches/:id', (req, res) => {
    const data = readData();
    const branch = data.branches.find(b => b.id === parseInt(req.params.id));
    if (!branch) {
        return res.status(404).json({ error: '지점을 찾을 수 없습니다.' });
    }
    res.json(branch);
});

// 지점 추가
app.post('/api/branches', upload.single('image'), (req, res) => {
    const data = readData();
    const newBranch = {
        id: data.branches.length > 0 ? Math.max(...data.branches.map(b => b.id)) + 1 : 1,
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        hours: req.body.hours,
        image: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-branch.jpg',
        description: req.body.description,
        features: req.body.features ? req.body.features.split(',').map(f => f.trim()) : []
    };
    
    data.branches.push(newBranch);
    writeData(data);
    res.json(newBranch);
});

// 지점 수정
app.put('/api/branches/:id', upload.single('image'), (req, res) => {
    const data = readData();
    const branchIndex = data.branches.findIndex(b => b.id === parseInt(req.params.id));
    
    if (branchIndex === -1) {
        return res.status(404).json({ error: '지점을 찾을 수 없습니다.' });
    }
    
    const updatedBranch = {
        ...data.branches[branchIndex],
        name: req.body.name || data.branches[branchIndex].name,
        address: req.body.address || data.branches[branchIndex].address,
        phone: req.body.phone || data.branches[branchIndex].phone,
        hours: req.body.hours || data.branches[branchIndex].hours,
        description: req.body.description || data.branches[branchIndex].description,
        features: req.body.features ? req.body.features.split(',').map(f => f.trim()) : data.branches[branchIndex].features
    };
    
    if (req.file) {
        updatedBranch.image = `/uploads/${req.file.filename}`;
    }
    
    data.branches[branchIndex] = updatedBranch;
    writeData(data);
    res.json(updatedBranch);
});

// 지점 삭제
app.delete('/api/branches/:id', (req, res) => {
    const data = readData();
    const branchIndex = data.branches.findIndex(b => b.id === parseInt(req.params.id));
    
    if (branchIndex === -1) {
        return res.status(404).json({ error: '지점을 찾을 수 없습니다.' });
    }
    
    data.branches.splice(branchIndex, 1);
    writeData(data);
    res.json({ message: '지점이 삭제되었습니다.' });
});

// 슬라이드 API 라우트

// 모든 슬라이드 조회
app.get('/api/slides', (req, res) => {
    const data = readSlides();
    res.json(data.slides);
});

// 특정 슬라이드 조회
app.get('/api/slides/:id', (req, res) => {
    const data = readSlides();
    const slide = data.slides.find(s => s.id === parseInt(req.params.id));
    if (!slide) {
        return res.status(404).json({ error: '슬라이드를 찾을 수 없습니다.' });
    }
    res.json(slide);
});

// 슬라이드 추가
app.post('/api/slides', upload.single('image'), (req, res) => {
    const data = readSlides();
    const newSlide = {
        id: data.slides.length > 0 ? Math.max(...data.slides.map(s => s.id)) + 1 : 1,
        image: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-slide.jpg',
        title: req.body.title,
        description: req.body.description,
        active: req.body.active === 'true'
    };
    
    data.slides.push(newSlide);
    writeSlides(data);
    res.json(newSlide);
});

// 슬라이드 수정
app.put('/api/slides/:id', upload.single('image'), (req, res) => {
    const data = readSlides();
    const slideIndex = data.slides.findIndex(s => s.id === parseInt(req.params.id));
    
    if (slideIndex === -1) {
        return res.status(404).json({ error: '슬라이드를 찾을 수 없습니다.' });
    }
    
    const updatedSlide = {
        ...data.slides[slideIndex],
        title: req.body.title || data.slides[slideIndex].title,
        description: req.body.description || data.slides[slideIndex].description,
        active: req.body.active !== undefined ? req.body.active === 'true' : data.slides[slideIndex].active
    };
    
    if (req.file) {
        updatedSlide.image = `/uploads/${req.file.filename}`;
    }
    
    data.slides[slideIndex] = updatedSlide;
    writeSlides(data);
    res.json(updatedSlide);
});

// 슬라이드 삭제
app.delete('/api/slides/:id', (req, res) => {
    const data = readSlides();
    const slideIndex = data.slides.findIndex(s => s.id === parseInt(req.params.id));
    
    if (slideIndex === -1) {
        return res.status(404).json({ error: '슬라이드를 찾을 수 없습니다.' });
    }
    
    data.slides.splice(slideIndex, 1);
    writeSlides(data);
    res.json({ message: '슬라이드가 삭제되었습니다.' });
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 관리자 페이지 라우트
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`🏆 금박사 서버가 http://localhost:${PORT} 에서 실행 중입니다!`);
}); 
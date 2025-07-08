require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { 
    connectToDatabase, 
    getNextId, 
    uploadImageToGridFS, 
    Review,
    Branch,
    Slide,
    Contact,
    initializeData 
} = require('./netlify/functions/utils/mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// 관리자 설정
const ADMIN_PASSWORD = 'admin123'; // 비밀번호를 원하는 값으로 변경하세요

// Multer 설정 (업로드 저장소)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// 업로드 파일 서빙
app.use('/uploads', express.static('uploads'));

// 데이터 파일 경로들
const dataFile = './data/branches.json';
const slidesFile = './data/slides.json';
const contactFile = './data/contact.json';
const reviewsFile = './data/reviews.json';

// 초기 데이터 로드 함수
function loadInitialData() {
    try {
        if (fs.existsSync(dataFile)) {
            const data = fs.readFileSync(dataFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.branches;
        }
    } catch (error) {
        console.error('Error loading initial branches data:', error);
    }
    
    // 기본 데이터 반환
    return [
        {
            id: 1,
            name: "강남점",
            address: "서울특별시 강남구 테헤란로 123",
            phone: "02-1234-5678",
            hours: "평일 9:00-18:00, 토요일 9:00-15:00",
            image: "/uploads/default-branch.jpg",
            description: "강남 최고의 금 매입 전문점입니다. 공정한 시세와 친절한 서비스로 고객만족을 최우선으로 합니다.",
            features: ["24K 금 전문 매입", "실시간 시세 적용", "당일 현금 지급", "무료 감정"],
            lat: 37.5012767,
            lng: 127.0396417
        },
        {
            id: 2,
            name: "홍대점",
            address: "서울특별시 마포구 홍익로 456",
            phone: "02-2345-6789",
            hours: "평일 10:00-19:00, 토요일 10:00-16:00",
            image: "/uploads/default-branch.jpg",
            description: "홍대 젊은 거리에 위치한 신뢰할 수 있는 금 매입 전문점입니다.",
            features: ["금 반지/목걸이 전문", "학생 할인 혜택", "온라인 시세 확인", "안전한 거래"],
            lat: 37.5563059,
            lng: 126.9220571
        }
    ];
}

// 초기 슬라이드 데이터 로드 함수
function loadInitialSlides() {
    try {
        if (fs.existsSync(slidesFile)) {
            const data = fs.readFileSync(slidesFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.slides;
        }
    } catch (error) {
        console.error('Error loading initial slides data:', error);
    }
    
    // 기본 데이터 반환
    return [
        {
            id: 1,
            image: "/korea-map.svg",
            title: "최고가 매입 보장",
            description: "시중 최고가로 귀하의 금을 매입해드립니다",
            active: true
        },
        {
            id: 2,
            image: "/korea-map.svg",
            title: "당일 현금 지급",
            description: "감정 후 즉시 현금으로 지급해드립니다",
            active: true
        },
        {
            id: 3,
            image: "/korea-map.svg",
            title: "전문 감정사 상주",
            description: "정확한 감정을 위한 전문가가 항상 대기합니다",
            active: true
        }
    ];
}

// 초기 연락처 데이터 로드 함수
function loadInitialContact() {
    try {
        if (fs.existsSync(contactFile)) {
            const data = fs.readFileSync(contactFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading initial contact data:', error);
    }
    
    // 기본 데이터 반환
    return {
        phone: {
            number: "1588-1234",
            hours: "평일 9:00-18:00"
        },
        email: {
            address: "info@geumbaeksa.com",
            hours: "24시간 접수"
        },
        kakao: {
            id: "@금박사",
            hours: "평일 9:00-18:00"
        }
    };
}

// MongoDB 연결 초기화
async function initializeServer() {
    try {
        if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb+srv://username:password@cluster.mongodb.net/geumbaeksa?retryWrites=true&w=majority') {
            await connectToDatabase();
            await initializeData();
            console.log('✅ MongoDB 연결 및 초기화 완료');
        } else {
            console.log('⚠️  MongoDB URI가 설정되지 않았습니다. JSON 파일 모드로 실행합니다.');
            console.log('💡 MongoDB Atlas를 사용하려면 .env 파일에서 MONGODB_URI를 설정하세요.');
        }
    } catch (error) {
        console.error('❌ MongoDB 초기화 오류:', error);
        console.log('⚠️  JSON 파일 모드로 대체 실행합니다.');
    }
}

// JSON 파일 기반 지점 데이터 읽기 함수
function readData() {
    try {
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            const parsed = JSON.parse(fileContent);
            console.log('지점 데이터 로드됨:', parsed.branches.length, '개');
            return parsed;
        } else {
            // 파일이 없으면 초기 데이터로 생성
            const initialData = { branches: loadInitialData() };
            writeData(initialData);
            console.log('초기 지점 데이터 생성됨');
            return initialData;
        }
    } catch (error) {
        console.error('지점 데이터 읽기 오류:', error);
        return { branches: loadInitialData() };
    }
}

// JSON 파일 기반 지점 데이터 쓰기 함수
function writeData(data) {
    try {
        // data 디렉토리가 없으면 생성
        const dataDir = path.dirname(dataFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
        console.log('지점 데이터 저장됨:', data.branches.length, '개');
    } catch (error) {
        console.error('지점 데이터 저장 오류:', error);
    }
}

// JSON 파일 기반 슬라이드 데이터 읽기 함수
function readSlides() {
    try {
        if (fs.existsSync(slidesFile)) {
            const fileContent = fs.readFileSync(slidesFile, 'utf8');
            const parsed = JSON.parse(fileContent);
            console.log('슬라이드 데이터 로드됨:', parsed.slides.length, '개');
            return parsed;
        } else {
            // 파일이 없으면 초기 데이터로 생성
            const initialData = { slides: loadInitialSlides() };
            writeSlides(initialData);
            console.log('초기 슬라이드 데이터 생성됨');
            return initialData;
        }
    } catch (error) {
        console.error('슬라이드 데이터 읽기 오류:', error);
        return { slides: loadInitialSlides() };
    }
}

// JSON 파일 기반 슬라이드 데이터 쓰기 함수
function writeSlides(data) {
    try {
        // data 디렉토리가 없으면 생성
        const dataDir = path.dirname(slidesFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(slidesFile, JSON.stringify(data, null, 2), 'utf8');
        console.log('슬라이드 데이터 저장됨:', data.slides.length, '개');
    } catch (error) {
        console.error('슬라이드 데이터 저장 오류:', error);
    }
}

// JSON 파일 기반 연락처 데이터 읽기 함수
function readContact() {
    try {
        if (fs.existsSync(contactFile)) {
            const fileContent = fs.readFileSync(contactFile, 'utf8');
            const parsed = JSON.parse(fileContent);
            console.log('연락처 데이터 로드됨');
            return parsed;
        } else {
            // 파일이 없으면 초기 데이터로 생성
            const initialData = loadInitialContact();
            writeContact(initialData);
            console.log('초기 연락처 데이터 생성됨');
            return initialData;
        }
    } catch (error) {
        console.error('연락처 데이터 읽기 오류:', error);
        return loadInitialContact();
    }
}

// JSON 파일 기반 연락처 데이터 쓰기 함수
function writeContact(data) {
    try {
        // data 디렉토리가 없으면 생성
        const dataDir = path.dirname(contactFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(contactFile, JSON.stringify(data, null, 2), 'utf8');
        console.log('연락처 데이터 저장됨');
    } catch (error) {
        console.error('연락처 데이터 저장 오류:', error);
    }
}

// MongoDB 기반 후기 데이터 처리 함수들은 mongoose 모델을 직접 사용

// 관리자 인증 미들웨어 (간단한 버전)
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    console.log('인증 확인:', {
        method: req.method,
        url: req.url,
        hasAuth: !!auth,
        authValue: auth
    });
    
    if (auth && auth === `Bearer ${ADMIN_PASSWORD}`) {
        console.log('인증 성공');
        next();
    } else {
        console.log('인증 실패');
        res.status(401).json({ error: '관리자 권한이 필요합니다.' });
    }
}

// 관리자 로그인 API
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ 
            success: true, 
            token: ADMIN_PASSWORD,
            message: '로그인 성공' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: '비밀번호가 틀렸습니다.' 
        });
    }
});

// 관리자 인증 상태 확인 API
app.get('/api/admin/status', (req, res) => {
    const auth = req.headers.authorization;
    res.json({ isAdmin: auth === `Bearer ${ADMIN_PASSWORD}` });
});

// API 라우트 - KV 기반 완전 기능 CRUD

// 모든 지점 조회
app.get('/api/branches', (req, res) => {
    try {
        const data = readData();
        res.json(data.branches);
    } catch (error) {
        console.error('Error getting branches:', error);
        res.status(500).json({ error: '지점 조회 중 오류가 발생했습니다.' });
    }
});

// 특정 지점 조회
app.get('/api/branches/:id', (req, res) => {
    try {
        const data = readData();
        const branch = data.branches.find(b => b.id === parseInt(req.params.id));
        if (!branch) {
            return res.status(404).json({ error: '지점을 찾을 수 없습니다.' });
        }
        res.json(branch);
    } catch (error) {
        console.error('Error getting branch:', error);
        res.status(500).json({ error: '지점 조회 중 오류가 발생했습니다.' });
    }
});

// 지점 추가
app.post('/api/branches', requireAuth, upload.single('image'), (req, res) => {
    try {
        const data = readData();
        const newBranch = {
            id: data.branches.length > 0 ? Math.max(...data.branches.map(b => b.id)) + 1 : 1,
            name: req.body.name,
            address: req.body.address,
            phone: req.body.phone,
            hours: req.body.hours,
            image: req.file ? `/uploads/${req.file.filename}` : req.body.image || '/uploads/default-branch.jpg',
            description: req.body.description,
            features: req.body.features ? req.body.features.split(',').map(f => f.trim()) : [],
            lat: parseFloat(req.body.lat) || 37.5665,
            lng: parseFloat(req.body.lng) || 126.9780
        };
        
        data.branches.push(newBranch);
        writeData(data);
        res.json(newBranch);
    } catch (error) {
        console.error('지점 추가 오류:', error);
        res.status(500).json({ error: '지점 추가 중 오류가 발생했습니다.' });
    }
});

// 지점 수정
app.put('/api/branches/:id', requireAuth, upload.single('image'), (req, res) => {
    try {
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
            features: req.body.features ? req.body.features.split(',').map(f => f.trim()) : data.branches[branchIndex].features,
            lat: req.body.lat ? parseFloat(req.body.lat) : data.branches[branchIndex].lat,
            lng: req.body.lng ? parseFloat(req.body.lng) : data.branches[branchIndex].lng
        };
        
        if (req.file) {
            updatedBranch.image = `/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            updatedBranch.image = req.body.image;
        }
        
        data.branches[branchIndex] = updatedBranch;
        writeData(data);
        res.json(updatedBranch);
    } catch (error) {
        console.error('지점 수정 오류:', error);
        res.status(500).json({ error: '지점 수정 중 오류가 발생했습니다.' });
    }
});

// 지점 삭제
app.delete('/api/branches/:id', requireAuth, (req, res) => {
    try {
        console.log('삭제 요청 받음 - ID:', req.params.id);
        const data = readData();
        console.log('현재 지점 수:', data.branches.length);
        
        const branchIndex = data.branches.findIndex(b => b.id === parseInt(req.params.id));
        console.log('찾은 지점 인덱스:', branchIndex);
        
        if (branchIndex === -1) {
            console.log('지점을 찾을 수 없음');
            return res.status(404).json({ error: '지점을 찾을 수 없습니다.' });
        }
        
        const deletedBranch = data.branches[branchIndex];
        console.log('삭제할 지점:', deletedBranch.name);
        
        data.branches.splice(branchIndex, 1);
        writeData(data);
        
        console.log('지점 삭제 완료, 남은 지점 수:', data.branches.length);
        res.json({ message: '지점이 삭제되었습니다.', deletedBranch });
    } catch (error) {
        console.error('지점 삭제 오류:', error);
        res.status(500).json({ error: '지점 삭제 중 오류가 발생했습니다.' });
    }
});

// 슬라이드 API 라우트 - KV 기반 완전 기능 CRUD

// 모든 슬라이드 조회
app.get('/api/slides', (req, res) => {
    try {
        const data = readSlides();
        res.json(data.slides);
    } catch (error) {
        console.error('Error getting slides:', error);
        res.status(500).json({ error: '슬라이드 조회 중 오류가 발생했습니다.' });
    }
});

// 특정 슬라이드 조회
app.get('/api/slides/:id', (req, res) => {
    try {
        const data = readSlides();
        const slide = data.slides.find(s => s.id === parseInt(req.params.id));
        if (!slide) {
            return res.status(404).json({ error: '슬라이드를 찾을 수 없습니다.' });
        }
        res.json(slide);
    } catch (error) {
        console.error('Error getting slide:', error);
        res.status(500).json({ error: '슬라이드 조회 중 오류가 발생했습니다.' });
    }
});

// 슬라이드 추가
app.post('/api/slides', requireAuth, upload.single('image'), (req, res) => {
    try {
        const data = readSlides();
        const newSlide = {
            id: data.slides.length > 0 ? Math.max(...data.slides.map(s => s.id)) + 1 : 1,
            image: req.file ? `/uploads/${req.file.filename}` : req.body.image || '/korea-map.svg',
            title: req.body.title,
            description: req.body.description,
            active: req.body.active === 'true' || req.body.active === true
        };
        
        data.slides.push(newSlide);
        writeSlides(data);
        res.json(newSlide);
    } catch (error) {
        console.error('슬라이드 추가 오류:', error);
        res.status(500).json({ error: '슬라이드 추가 중 오류가 발생했습니다.' });
    }
});

// 슬라이드 수정
app.put('/api/slides/:id', requireAuth, upload.single('image'), (req, res) => {
    try {
        const data = readSlides();
        const slideIndex = data.slides.findIndex(s => s.id === parseInt(req.params.id));
        
        if (slideIndex === -1) {
            return res.status(404).json({ error: '슬라이드를 찾을 수 없습니다.' });
        }
        
        const updatedSlide = {
            ...data.slides[slideIndex],
            title: req.body.title || data.slides[slideIndex].title,
            description: req.body.description || data.slides[slideIndex].description,
            active: req.body.active !== undefined ? (req.body.active === 'true' || req.body.active === true) : data.slides[slideIndex].active
        };
        
        if (req.file) {
            updatedSlide.image = `/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            updatedSlide.image = req.body.image;
        }
        
        data.slides[slideIndex] = updatedSlide;
        writeSlides(data);
        res.json(updatedSlide);
    } catch (error) {
        console.error('슬라이드 수정 오류:', error);
        res.status(500).json({ error: '슬라이드 수정 중 오류가 발생했습니다.' });
    }
});

// 슬라이드 삭제
app.delete('/api/slides/:id', requireAuth, (req, res) => {
    try {
        console.log('슬라이드 삭제 요청 받음 - ID:', req.params.id);
        const data = readSlides();
        console.log('현재 슬라이드 수:', data.slides.length);
        
        const slideIndex = data.slides.findIndex(s => s.id === parseInt(req.params.id));
        console.log('찾은 슬라이드 인덱스:', slideIndex);
        
        if (slideIndex === -1) {
            console.log('슬라이드를 찾을 수 없음');
            return res.status(404).json({ error: '슬라이드를 찾을 수 없습니다.' });
        }
        
        const deletedSlide = data.slides[slideIndex];
        console.log('삭제할 슬라이드:', deletedSlide.title);
        
        data.slides.splice(slideIndex, 1);
        writeSlides(data);
        
        console.log('슬라이드 삭제 완료, 남은 슬라이드 수:', data.slides.length);
        res.json({ message: '슬라이드가 삭제되었습니다.', deletedSlide });
    } catch (error) {
        console.error('슬라이드 삭제 오류:', error);
        res.status(500).json({ error: '슬라이드 삭제 중 오류가 발생했습니다.' });
    }
});

// 연락처 API 라우트 - KV 기반 완전 기능

// 연락처 정보 조회
app.get('/api/contact', (req, res) => {
    try {
        const data = readContact();
        res.json(data);
    } catch (error) {
        console.error('Error getting contact:', error);
        res.status(500).json({ error: '연락처 조회 중 오류가 발생했습니다.' });
    }
});

// 연락처 정보 수정
app.put('/api/contact', requireAuth, (req, res) => {
    try {
        const currentContact = readContact();
        const updatedContact = {
            phone: {
                number: req.body.phone_number || currentContact.phone.number,
                hours: req.body.phone_hours || currentContact.phone.hours
            },
            email: {
                address: req.body.email_address || currentContact.email.address,
                hours: req.body.email_hours || currentContact.email.hours
            },
            kakao: {
                id: req.body.kakao_id || currentContact.kakao.id,
                hours: req.body.kakao_hours || currentContact.kakao.hours
            }
        };
        
        writeContact(updatedContact);
        res.json(updatedContact);
    } catch (error) {
        console.error('연락처 수정 오류:', error);
        res.status(500).json({ error: '연락처 수정 중 오류가 발생했습니다.' });
    }
});

// 후기 API 라우트 - KV 기반 완전 기능 CRUD

// 모든 후기 조회
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({ error: '후기 조회 중 오류가 발생했습니다.' });
    }
});

// 특정 후기 조회
app.get('/api/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findOne({ id: parseInt(req.params.id) });
        if (!review) {
            return res.status(404).json({ error: '후기를 찾을 수 없습니다.' });
        }
        res.json(review);
    } catch (error) {
        console.error('Error getting review:', error);
        res.status(500).json({ error: '후기 조회 중 오류가 발생했습니다.' });
    }
});

// 지점별 후기 조회
app.get('/api/reviews/branch/:branchId', async (req, res) => {
    try {
        const branchReviews = await Review.find({ 
            branchId: parseInt(req.params.branchId), 
            isActive: true 
        }).sort({ createdAt: -1 });
        res.json(branchReviews);
    } catch (error) {
        console.error('Error getting branch reviews:', error);
        res.status(500).json({ error: '지점별 후기 조회 중 오류가 발생했습니다.' });
    }
});

// 랜덤 후기 조회
app.get('/api/reviews/random/:count', async (req, res) => {
    try {
        const activeReviews = await Review.find({ isActive: true });
        const count = Math.min(parseInt(req.params.count) || 3, activeReviews.length);
        
        if (activeReviews.length === 0) {
            return res.json([]);
        }
        
        // 랜덤 선택
        const shuffled = activeReviews.sort(() => 0.5 - Math.random());
        const randomReviews = shuffled.slice(0, count);
        
        res.json(randomReviews);
    } catch (error) {
        console.error('Error getting random reviews:', error);
        res.status(500).json({ error: '랜덤 후기 조회 중 오류가 발생했습니다.' });
    }
});

// 후기 추가
app.post('/api/reviews', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const reviewData = {
            id: await getNextId(Review),
            branchId: parseInt(req.body.branchId),
            branchName: req.body.branchName,
            customerName: req.body.customerName,
            rating: parseInt(req.body.rating) || 5,
            comment: req.body.comment,
            image: '',
            isActive: req.body.isActive !== undefined ? (req.body.isActive === 'true' || req.body.isActive === true) : true
        };
        
        // 이미지 처리 - GridFS 사용
        if (req.file) {
            const buffer = fs.readFileSync(req.file.path);
            const imageUrl = await uploadImageToGridFS(
                buffer,
                req.file.originalname,
                req.file.mimetype
            );
            reviewData.image = imageUrl;
        }
        
        const newReview = new Review(reviewData);
        await newReview.save();
        
        res.json(newReview);
    } catch (error) {
        console.error('후기 추가 오류:', error);
        res.status(500).json({ error: '후기 추가 중 오류가 발생했습니다.' });
    }
});

// 후기 수정
app.put('/api/reviews/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const review = await Review.findOne({ id: reviewId });
        
        if (!review) {
            return res.status(404).json({ error: '후기를 찾을 수 없습니다.' });
        }
        
        const updateData = {
            branchId: req.body.branchId ? parseInt(req.body.branchId) : review.branchId,
            branchName: req.body.branchName || review.branchName,
            customerName: req.body.customerName || review.customerName,
            rating: req.body.rating ? parseInt(req.body.rating) : review.rating,
            comment: req.body.comment || review.comment,
            isActive: req.body.isActive !== undefined ? (req.body.isActive === 'true' || req.body.isActive === true) : review.isActive
        };
        
        // 이미지 처리 - GridFS 사용
        if (req.file) {
            const buffer = fs.readFileSync(req.file.path);
            const imageUrl = await uploadImageToGridFS(
                buffer,
                req.file.originalname,
                req.file.mimetype
            );
            updateData.image = imageUrl;
        } else if (req.body.image !== undefined) {
            updateData.image = req.body.image;
        }
        
        const updatedReview = await Review.findOneAndUpdate(
            { id: reviewId },
            updateData,
            { new: true }
        );
        
        res.json(updatedReview);
    } catch (error) {
        console.error('후기 수정 오류:', error);
        res.status(500).json({ error: '후기 수정 중 오류가 발생했습니다.' });
    }
});

// 후기 삭제
app.delete('/api/reviews/:id', requireAuth, async (req, res) => {
    try {
        console.log('후기 삭제 요청 받음 - ID:', req.params.id);
        const reviewId = parseInt(req.params.id);
        
        const deletedReview = await Review.findOneAndDelete({ id: reviewId });
        
        if (!deletedReview) {
            console.log('후기를 찾을 수 없음');
            return res.status(404).json({ error: '후기를 찾을 수 없습니다.' });
        }
        
        console.log('삭제할 후기:', deletedReview.customerName);
        console.log('후기 삭제 완료');
        
        res.json({ message: '후기가 삭제되었습니다.', deletedReview });
    } catch (error) {
        console.error('후기 삭제 오류:', error);
        res.status(500).json({ error: '후기 삭제 중 오류가 발생했습니다.' });
    }
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 관리자 페이지 라우트
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 정적 파일 직접 서빙
app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'script.js'));
});

app.get('/admin.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'admin.css'));
});

app.get('/admin.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'admin.js'));
});

app.get('/korea-map.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(__dirname, 'public', 'korea-map.svg'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
});

// 서버 시작
async function startServer() {
    await initializeServer();
    
    // 로컬 서버 실행 (외부 접속 가능)
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행되고 있습니다.`);
        console.log(`🌐 네트워크 접속: http://YOUR_IP:${PORT}`);
        console.log(`📝 관리자 페이지: http://localhost:${PORT}/admin`);
        console.log(`🔑 관리자 비밀번호: ${ADMIN_PASSWORD}`);
        console.log(`💡 내 IP 주소 확인: ipconfig 명령어로 확인하세요`);
    });
}

startServer().catch(console.error); 
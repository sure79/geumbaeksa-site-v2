const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// 관리자 설정
const ADMIN_PASSWORD = 'admin123'; // 비밀번호를 원하는 값으로 변경하세요

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static('public'));

// 정적 데이터 (읽기 전용)
const staticData = {
    branches: [
        {
            id: 1,
            name: "강남점",
            address: "서울특별시 강남구 테헤란로 123",
            phone: "02-1234-5678",
            hours: "평일 9:00-18:00, 토요일 9:00-15:00",
            image: "/korea-map.svg",
            description: "강남 최고의 금 매입 전문점입니다. 공정한 시세와 친절한 서비스로 고객만족을 최우선으로 합니다.",
            features: ["24K 금 전문 매입", "실시간 시세 적용", "당일 현금 지급", "무료 감정"]
        },
        {
            id: 2,
            name: "홍대점",
            address: "서울특별시 마포구 홍익로 456",
            phone: "02-2345-6789",
            hours: "평일 10:00-19:00, 토요일 10:00-16:00",
            image: "/korea-map.svg",
            description: "홍대 젊은 거리에 위치한 신뢰할 수 있는 금 매입 전문점입니다.",
            features: ["금 반지/목걸이 전문", "학생 할인 혜택", "온라인 시세 확인", "안전한 거래"]
        }
    ],
    slides: [
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
    ],
    contact: {
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
    }
};

// 관리자 인증 미들웨어 (간단한 버전)
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (auth && auth === `Bearer ${ADMIN_PASSWORD}`) {
        next();
    } else {
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

// API 라우트 - 읽기 전용

// 모든 지점 조회
app.get('/api/branches', (req, res) => {
    res.json(staticData.branches);
});

// 특정 지점 조회
app.get('/api/branches/:id', (req, res) => {
    const branch = staticData.branches.find(b => b.id === parseInt(req.params.id));
    if (!branch) {
        return res.status(404).json({ error: '지점을 찾을 수 없습니다.' });
    }
    res.json(branch);
});

// 지점 추가 (읽기 전용 알림)
app.post('/api/branches', requireAuth, (req, res) => {
    res.status(501).json({ 
        error: '현재 데모 버전에서는 데이터 수정이 불가능합니다.',
        message: '실제 운영 시 데이터베이스 연동이 필요합니다.'
    });
});

// 지점 수정 (읽기 전용 알림)
app.put('/api/branches/:id', requireAuth, (req, res) => {
    res.status(501).json({ 
        error: '현재 데모 버전에서는 데이터 수정이 불가능합니다.',
        message: '실제 운영 시 데이터베이스 연동이 필요합니다.'
    });
});

// 지점 삭제 (읽기 전용 알림)
app.delete('/api/branches/:id', requireAuth, (req, res) => {
    res.status(501).json({ 
        error: '현재 데모 버전에서는 데이터 수정이 불가능합니다.',
        message: '실제 운영 시 데이터베이스 연동이 필요합니다.'
    });
});

// 슬라이드 API 라우트 - 읽기 전용

// 모든 슬라이드 조회
app.get('/api/slides', (req, res) => {
    res.json(staticData.slides);
});

// 특정 슬라이드 조회
app.get('/api/slides/:id', (req, res) => {
    const slide = staticData.slides.find(s => s.id === parseInt(req.params.id));
    if (!slide) {
        return res.status(404).json({ error: '슬라이드를 찾을 수 없습니다.' });
    }
    res.json(slide);
});

// 슬라이드 추가 (읽기 전용 알림)
app.post('/api/slides', requireAuth, (req, res) => {
    res.status(501).json({ 
        error: '현재 데모 버전에서는 데이터 수정이 불가능합니다.',
        message: '실제 운영 시 데이터베이스 연동이 필요합니다.'
    });
});

// 슬라이드 수정 (읽기 전용 알림)
app.put('/api/slides/:id', requireAuth, (req, res) => {
    res.status(501).json({ 
        error: '현재 데모 버전에서는 데이터 수정이 불가능합니다.',
        message: '실제 운영 시 데이터베이스 연동이 필요합니다.'
    });
});

// 슬라이드 삭제 (읽기 전용 알림)
app.delete('/api/slides/:id', requireAuth, (req, res) => {
    res.status(501).json({ 
        error: '현재 데모 버전에서는 데이터 수정이 불가능합니다.',
        message: '실제 운영 시 데이터베이스 연동이 필요합니다.'
    });
});

// 연락처 API 라우트 - 읽기 전용

// 연락처 정보 조회
app.get('/api/contact', (req, res) => {
    res.json(staticData.contact);
});

// 연락처 정보 수정 (읽기 전용 알림)
app.put('/api/contact', requireAuth, (req, res) => {
    res.status(501).json({ 
        error: '현재 데모 버전에서는 데이터 수정이 불가능합니다.',
        message: '실제 운영 시 데이터베이스 연동이 필요합니다.'
    });
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 관리자 페이지 라우트
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
});

// Vercel을 위한 export
module.exports = app; 
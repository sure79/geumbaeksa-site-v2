const fs = require('fs');
const path = require('path');

// 데이터 파일 경로들
const dataFile = path.join(process.cwd(), 'data', 'branches.json');
const slidesFile = path.join(process.cwd(), 'data', 'slides.json');
const contactFile = path.join(process.cwd(), 'data', 'contact.json');

// 관리자 설정
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 초기 데이터 로드 함수들
function loadInitialData() {
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

function loadInitialSlides() {
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

function loadInitialContact() {
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

// 데이터 읽기 함수들
function readData() {
    try {
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            return JSON.parse(fileContent);
        } else {
            const initialData = { branches: loadInitialData() };
            writeData(initialData);
            return initialData;
        }
    } catch (error) {
        console.error('지점 데이터 읽기 오류:', error);
        return { branches: loadInitialData() };
    }
}

function writeData(data) {
    try {
        const dataDir = path.dirname(dataFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('지점 데이터 저장 오류:', error);
    }
}

function readSlides() {
    try {
        if (fs.existsSync(slidesFile)) {
            const fileContent = fs.readFileSync(slidesFile, 'utf8');
            return JSON.parse(fileContent);
        } else {
            const initialData = { slides: loadInitialSlides() };
            writeSlides(initialData);
            return initialData;
        }
    } catch (error) {
        console.error('슬라이드 데이터 읽기 오류:', error);
        return { slides: loadInitialSlides() };
    }
}

function writeSlides(data) {
    try {
        const dataDir = path.dirname(slidesFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(slidesFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('슬라이드 데이터 저장 오류:', error);
    }
}

function readContact() {
    try {
        if (fs.existsSync(contactFile)) {
            const fileContent = fs.readFileSync(contactFile, 'utf8');
            return JSON.parse(fileContent);
        } else {
            const initialData = loadInitialContact();
            writeContact(initialData);
            return initialData;
        }
    } catch (error) {
        console.error('연락처 데이터 읽기 오류:', error);
        return loadInitialContact();
    }
}

function writeContact(data) {
    try {
        const dataDir = path.dirname(contactFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(contactFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('연락처 데이터 저장 오류:', error);
    }
}

// 인증 함수
function requireAuth(headers) {
    const auth = headers.authorization;
    return auth === `Bearer ${ADMIN_PASSWORD}`;
}

// HTTP 응답 헬퍼 함수
function createResponse(statusCode, data, headers = {}) {
    return {
        statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify(data)
    };
}

module.exports = {
    readData,
    writeData,
    readSlides,
    writeSlides,
    readContact,
    writeContact,
    requireAuth,
    createResponse,
    ADMIN_PASSWORD
}; 
require('dotenv').config();

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// MongoDB Atlas 연결
let cachedDb = null;
let gridFSBucket = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        cachedDb = connection;
        
        // GridFS 버킷 초기화
        gridFSBucket = new GridFSBucket(connection.connection.db, {
            bucketName: 'images'
        });
        
        console.log('MongoDB 연결 성공');
        return cachedDb;
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
        throw error;
    }
}

// 지점 스키마
const branchSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    hours: { type: String, required: true },
    image: { type: String, default: '/uploads/default-branch.jpg' },
    description: { type: String, required: true },
    features: [{ type: String }],
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
}, { timestamps: true });

// 슬라이드 스키마
const slideSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    image: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

// 연락처 스키마
const contactSchema = new mongoose.Schema({
    phone: {
        number: { type: String, required: true },
        hours: { type: String, required: true }
    },
    email: {
        address: { type: String, required: true },
        hours: { type: String, required: true }
    },
    kakao: {
        id: { type: String, required: true },
        hours: { type: String, required: true }
    }
}, { timestamps: true });

// 후기 스키마
const reviewSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    branchId: { type: Number, required: true },
    branchName: { type: String, required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 모델 생성
const Branch = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
const Slide = mongoose.models.Slide || mongoose.model('Slide', slideSchema);
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// GridFS 이미지 업로드 함수
async function uploadImageToGridFS(buffer, filename, contentType) {
    try {
        await connectToDatabase();
        
        return new Promise((resolve, reject) => {
            const uploadStream = gridFSBucket.openUploadStream(filename, {
                contentType: contentType
            });
            
            uploadStream.on('error', reject);
            uploadStream.on('finish', () => {
                const imageUrl = `/api/images/${uploadStream.id}`;
                resolve(imageUrl);
            });
            
            uploadStream.end(buffer);
        });
    } catch (error) {
        console.error('GridFS 업로드 오류:', error);
        throw error;
    }
}

// GridFS 이미지 다운로드 함수
async function downloadImageFromGridFS(fileId) {
    try {
        await connectToDatabase();
        
        const downloadStream = gridFSBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
        return downloadStream;
    } catch (error) {
        console.error('GridFS 다운로드 오류:', error);
        throw error;
    }
}

// 초기 데이터 생성 함수
async function initializeData() {
    try {
        await connectToDatabase();

        // 지점 데이터 초기화
        const branchCount = await Branch.countDocuments();
        if (branchCount === 0) {
            const initialBranches = [
                {
                    id: 1,
                    name: "강남점",
                    address: "서울특별시 강남구 테헤란로 123",
                    phone: "02-1234-5678",
                    hours: "평일 9:00-18:00, 토요일 9:00-15:00",
                    image: "/korea-map.svg",
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
                    image: "/korea-map.svg",
                    description: "홍대 젊은 거리에 위치한 신뢰할 수 있는 금 매입 전문점입니다.",
                    features: ["금 반지/목걸이 전문", "학생 할인 혜택", "온라인 시세 확인", "안전한 거래"],
                    lat: 37.5563059,
                    lng: 126.9220571
                }
            ];
            await Branch.insertMany(initialBranches);
            console.log('초기 지점 데이터 생성 완료');
        }

        // 슬라이드 데이터 초기화
        const slideCount = await Slide.countDocuments();
        if (slideCount === 0) {
            const initialSlides = [
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
            await Slide.insertMany(initialSlides);
            console.log('초기 슬라이드 데이터 생성 완료');
        }

        // 연락처 데이터 초기화
        const contactCount = await Contact.countDocuments();
        if (contactCount === 0) {
            const initialContact = {
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
            await Contact.create(initialContact);
            console.log('초기 연락처 데이터 생성 완료');
        }

        // 후기 데이터 초기화
        const reviewCount = await Review.countDocuments();
        if (reviewCount === 0) {
            const initialReviews = [
                {
                    id: 1,
                    branchId: 1,
                    branchName: "강남점",
                    customerName: "김**",
                    rating: 5,
                    comment: "정말 친절하고 공정한 시세로 거래해주셨어요. 다른 곳보다 훨씬 높은 가격에 매입해주셨습니다!",
                    image: "/uploads/1751849959138-983845141.png",
                    isActive: true
                },
                {
                    id: 2,
                    branchId: 3,
                    branchName: "부산금이빨",
                    customerName: "이**",
                    rating: 5,
                    comment: "출장 서비스 정말 만족스러웠어요. 집에서 편리하게 거래할 수 있어서 좋았습니다.",
                    image: "/uploads/1751850444923-344733715.png",
                    isActive: true
                },
                {
                    id: 3,
                    branchId: 2,
                    branchName: "홍대점",
                    customerName: "박**",
                    rating: 4,
                    comment: "빠른 감정과 즉시 현금 지급으로 만족합니다. 직원분들도 매우 친절하세요.",
                    image: "",
                    isActive: true
                },
                {
                    id: 4,
                    branchId: 1,
                    branchName: "강남점",
                    customerName: "최**",
                    rating: 5,
                    comment: "여러 곳 비교해봤는데 여기가 가장 높은 가격 제시해주셨어요. 신뢰할 수 있는 업체입니다.",
                    image: "/uploads/1751874433531-936402380.png",
                    isActive: true
                },
                {
                    id: 5,
                    branchId: 4,
                    branchName: "인천계양점",
                    customerName: "정**",
                    rating: 5,
                    comment: "정확한 감정과 투명한 거래 과정이 인상적이었습니다. 추천합니다!",
                    image: "/uploads/1751874441103-508982853.png",
                    isActive: true
                }
            ];
            await Review.insertMany(initialReviews);
            console.log('초기 후기 데이터 생성 완료');
        }

        return { Branch, Slide, Contact, Review };
    } catch (error) {
        console.error('데이터 초기화 오류:', error);
        throw error;
    }
}

// 다음 ID 생성 함수
async function getNextId(Model) {
    const lastItem = await Model.findOne().sort({ id: -1 });
    return lastItem ? lastItem.id + 1 : 1;
}

module.exports = {
    connectToDatabase,
    initializeData,
    getNextId,
    uploadImageToGridFS,
    downloadImageFromGridFS,
    Branch,
    Slide,
    Contact,
    Review
}; 
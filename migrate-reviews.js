const fs = require('fs');
const path = require('path');
const { 
    connectToDatabase, 
    Review 
} = require('./netlify/functions/utils/mongodb');

// 마이그레이션 스크립트
async function migrateReviews() {
    try {
        console.log('📤 후기 데이터 마이그레이션 시작...');
        
        // MongoDB 연결
        await connectToDatabase();
        console.log('✅ MongoDB 연결 성공');
        
        // 기존 JSON 파일 읽기
        const reviewsFile = './data/reviews.json';
        if (!fs.existsSync(reviewsFile)) {
            console.log('❌ reviews.json 파일이 존재하지 않습니다.');
            return;
        }
        
        const jsonData = fs.readFileSync(reviewsFile, 'utf8');
        const parsedData = JSON.parse(jsonData);
        const reviews = parsedData.reviews;
        
        console.log(`📊 마이그레이션할 후기 수: ${reviews.length}개`);
        
        // 기존 MongoDB 데이터 확인
        const existingCount = await Review.countDocuments();
        console.log(`📊 기존 MongoDB 후기 수: ${existingCount}개`);
        
        if (existingCount > 0) {
            console.log('⚠️  MongoDB에 이미 후기 데이터가 있습니다.');
            console.log('기존 데이터를 삭제하고 새로 마이그레이션하시겠습니까?');
            console.log('삭제하려면 스크립트에서 clearExisting = true로 설정하세요.');
            
            // 기존 데이터 삭제 옵션 (수동으로 설정)
            const clearExisting = false; // true로 변경하면 기존 데이터 삭제
            
            if (clearExisting) {
                await Review.deleteMany({});
                console.log('🗑️  기존 데이터 삭제 완료');
            } else {
                console.log('⏭️  기존 데이터 유지 - 중복 ID 확인 후 병합');
            }
        }
        
        // 마이그레이션 실행
        let successCount = 0;
        let skipCount = 0;
        
        for (const reviewData of reviews) {
            try {
                // ID 중복 확인
                const existingReview = await Review.findOne({ id: reviewData.id });
                
                if (existingReview) {
                    console.log(`⏭️  ID ${reviewData.id} 이미 존재 - 건너뛰기`);
                    skipCount++;
                    continue;
                }
                
                // 새 후기 생성
                const newReview = new Review({
                    id: reviewData.id,
                    branchId: reviewData.branchId,
                    branchName: reviewData.branchName,
                    customerName: reviewData.customerName,
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    image: reviewData.image || '',
                    isActive: reviewData.isActive !== undefined ? reviewData.isActive : true
                });
                
                await newReview.save();
                successCount++;
                console.log(`✅ 후기 마이그레이션 성공: ${reviewData.customerName} (ID: ${reviewData.id})`);
                
            } catch (error) {
                console.error(`❌ 후기 마이그레이션 실패 (ID: ${reviewData.id}):`, error.message);
            }
        }
        
        console.log('\n📊 마이그레이션 완료!');
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`⏭️  건너뛰기: ${skipCount}개`);
        console.log(`❌ 실패: ${reviews.length - successCount - skipCount}개`);
        
        // 최종 확인
        const finalCount = await Review.countDocuments();
        console.log(`📊 최종 MongoDB 후기 수: ${finalCount}개`);
        
        // 백업 파일 생성
        const backupFile = './data/reviews.json.backup';
        if (!fs.existsSync(backupFile)) {
            fs.copyFileSync(reviewsFile, backupFile);
            console.log(`💾 백업 파일 생성: ${backupFile}`);
        }
        
        console.log('\n🎉 마이그레이션이 완료되었습니다!');
        console.log('이제 서버를 재시작하여 MongoDB 기반 후기 시스템을 사용할 수 있습니다.');
        
    } catch (error) {
        console.error('❌ 마이그레이션 오류:', error);
    } finally {
        process.exit(0);
    }
}

// 마이그레이션 실행
if (require.main === module) {
    migrateReviews();
}

module.exports = { migrateReviews }; 
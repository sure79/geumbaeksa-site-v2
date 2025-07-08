const { downloadImageFromGridFS } = require('./utils/mongodb');

exports.handler = async (event, context) => {
    const { httpMethod, path } = event;
    
    if (httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: '허용되지 않는 메소드입니다.' })
        };
    }

    try {
        // 경로에서 이미지 ID 추출
        const pathParts = path.split('/');
        const imageId = pathParts[pathParts.length - 1];
        
        if (!imageId || imageId === 'images') {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: '이미지 ID가 필요합니다.' })
            };
        }

        const downloadStream = await downloadImageFromGridFS(imageId);
        
        // 스트림을 버퍼로 변환
        const chunks = [];
        
        return new Promise((resolve, reject) => {
            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            
            downloadStream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                resolve({
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'image/jpeg', // 기본값, 나중에 메타데이터에서 가져올 수 있음
                        'Cache-Control': 'public, max-age=31536000', // 1년 캐시
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: buffer.toString('base64'),
                    isBase64Encoded: true
                });
            });
            
            downloadStream.on('error', (error) => {
                console.error('이미지 다운로드 오류:', error);
                resolve({
                    statusCode: 404,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ error: '이미지를 찾을 수 없습니다.' })
                });
            });
        });
        
    } catch (error) {
        console.error('이미지 서빙 오류:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: '서버 오류가 발생했습니다.' })
        };
    }
}; 
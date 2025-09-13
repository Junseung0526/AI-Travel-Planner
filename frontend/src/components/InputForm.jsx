// 여행 정보를 입력받는 폼 컴포넌트
import React, { useState } from 'react';

const InputForm = ({ onPlanSubmit }) => {
    const [destination, setDestination] = useState('');
    const [duration, setDuration] = useState('');
    const [interests, setInterests] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!destination || !duration || !interests) {
            alert('모든 필드를 채워주세요!');
            return;
        }
        // 부모 컴포넌트(App.jsx)로 입력값 전달
        onPlanSubmit({ destination, duration, interests });
    };

    return (
        <form onSubmit={handleSubmit} className="input-form">
            <div>
                <label>
                    목적지:
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="예: 파리"
                    />
                </label>
            </div>
            <div>
                <label>
                    여행 기간:
                    <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="예: 3박 4일"
                    />
                </label>
            </div>
            <div>
                <label>
                    관심사:
                    <input
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="예: 맛집, 박물관, 쇼핑"
                    />
                </label>
            </div>
            <button type="submit">여행 계획 생성</button>
        </form>
    );
};

export default InputForm;
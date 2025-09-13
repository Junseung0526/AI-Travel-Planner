import React, { useState } from 'react';
import Header from './components/Header.jsx';
import InputForm from './components/InputForm.jsx';
import ItineraryDisplay from './components/ItineraryDisplay.jsx';
import './App.css';

function App() {
    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const DEV = process.env.DEV_API_URL;

    const handlePlanSubmit = async (planData) => {
        setLoading(true);
        setError(null);
        setItinerary(null);

        try {
            const response = await fetch(`${DEV}/api/travel/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(planData),
            });

            if (!response.ok) {
                throw new Error('네트워크 응답이 올바르지 않습니다.');
            }

            const data = await response.json();
            setItinerary(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setError('여행 일정을 생성하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <Header />
            <main>
                {loading && <p>여행 일정을 생성 중입니다...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !itinerary && (
                    <InputForm onPlanSubmit={handlePlanSubmit} />
                )}
                {itinerary && <ItineraryDisplay itinerary={itinerary} />}
            </main>
        </div>
    );
}

export default App;
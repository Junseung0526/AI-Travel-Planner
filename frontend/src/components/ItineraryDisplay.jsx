//AI가 생성한 일정을 보여주는 컴포넌트
import React from 'react';

const ItineraryDisplay = ({ itinerary }) => {
    if (!itinerary || !itinerary.itinerary) {
        return <p>아직 생성된 여행 일정이 없습니다.</p>;
    }

    return (
        <div className="itinerary-display">
            <h2>{itinerary.tripTitle}</h2>
            {itinerary.itinerary.map((dayPlan, index) => (
                <div key={index} className="day-plan">
                    <h3>{dayPlan.day}</h3>
                    <ul>
                        {dayPlan.activities.map((activity, activityIndex) => (
                            <li key={activityIndex}>
                                <strong>{activity.time}</strong>: {activity.activityName}

                                <p>{activity.description}</p>
                                {activity.notes && <p className="notes">참고: {activity.notes}</p>}

                                {activity.imageURL && (
                                    <img src={activity.imageURL} alt={activity.activityName} style={{ maxWidth: '100%', height: 'auto' }} />)}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default ItineraryDisplay;
import './ColorCard.css';

function ColorCard({ name, cssVar }) {
    return (
        <div className="color-card">
            <div
                className="color-card__preview"
                style={{ backgroundColor: `var(${cssVar})` }}
            />
            <div className="color-card__info">
                <div className="color-card__name">{name}</div>
                <div className="color-card__var">{cssVar}</div>
            </div>
        </div>
    );
}

export default ColorCard;

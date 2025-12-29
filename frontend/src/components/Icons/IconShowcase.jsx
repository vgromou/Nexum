import './IconShowcase.css';

function IconShowcase({ icon: Icon, name, color }) {
    return (
        <div className="icon-showcase">
            <Icon size={32} color={color} />
            <small>{name}</small>
        </div>
    );
}

export default IconShowcase;

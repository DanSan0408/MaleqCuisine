const jwt = require('jsonwebtoken');

const verifyToken = (roles = []) => {
    return (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) return res.status(403).json({ message: "No token provided" });

        const bearerToken = token.split(' ')[1]; // "Bearer <token>"

        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ message: "Unauthorized!" });
            
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Require specific role!" });
            }
            
            req.userId = decoded.id;
            req.userRole = decoded.role;
            next();
        });
    };
};

module.exports = { verifyToken };
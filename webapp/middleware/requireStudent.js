function requireStudent(req, res, next) {
    // Check if the user is authenticated and has the student role (checked in opposite, e.g. != to)
    if (!req.session.userID || req.session.role !== 'student') {
        return res.redirect('/?error=1'); // Redirect to sign-in page with error message
    }

    return next();  // If the user is authenticated and has the admin role, continue to the next middleware or route handler
}

module.exports = requireStudent;
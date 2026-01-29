const db = require('../db');

describe('DB Import Sanity', () => {
    it('should import db', () => {
        expect(db).toBeDefined();
    });
});

# Invalid Registration Test Data

## Missing Fields
```
name: "" (empty)
email: ""
username: ""
password: ""
avatar: (missing)
```

## Invalid Email
```
name: "Test User"
email: "not-an-email"
username: "testuser"
password: "password123"
```

## Username Too Short
```
name: "Test User"
email: "test@example.com"
username: "ab" (2 chars, min is 3)
password: "password123"
```

## Username with Special Characters
```
name: "Test User"
email: "test@example.com"
username: "test@user!" (invalid chars)
password: "password123"
```

## Password Too Short
```
name: "Test User"
email: "test@example.com"
username: "testuser"
password: "12345" (5 chars, min is 6)
```

## Name Too Short
```
name: "Ab" (2 chars, min is 3)
email: "test@example.com"
username: "testuser"
password: "password123"
```
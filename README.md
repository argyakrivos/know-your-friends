# Know Your Friends

This is a simple utility to figure out your best Facebook mates, along with those you haven't kept touch.

- Shows you your best mates along with those that's been a while
- Allows you to visit a friend's profile
- ~~Allows you to send a message to a friend~~

## Installation

This project makes use of [NodeJS](http://nodejs.org/) and [Bower](http://bower.io/).

```
$ npm install
$ bower install
```

## Usage

Due to Facebook's security reasons, you will need to add the following lines to your `/etc/hosts`:

```
127.0.0.1  knowyourfriends.akrivos.com
```

Then all you need to do is start it:

```
$ npm start
```

Now, check it out at http://knowyourfriends.akrivos.com:3000/

## Feature plans

- Add some level of caching, since it takes quite some time to crunch all the data.
- Add a feature to keep your friend list each time you visit in order to detect who deleted you.
- Involve other social networks (e.g., Twitter, Foursquare, Instagram, etc.) to be a better estimate for your people you stay in contact with.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

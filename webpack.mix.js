let mix = require('laravel-mix');

mix.sass('sass/style.scss', 'css');

mix.options({
    processCssUrls: false,
})

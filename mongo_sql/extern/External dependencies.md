# External libraries for sonar-fdw

## mongo-c-driver

Source: <https://github.com/mongodb/mongo-c-driver/releases>

Includes are placed in extern/include/libbson-1.0 and extern/include/libmongoc-1.0. Custom-build static libraries are placed in extern/lib/libbson-1.0.a, extern/lib/libmongoc-1.0.a, and extern/lib/libmongoc-priv.a.

### Build directions

We need to enable the static library, and build with position-independent code. In addition, for some reason this package only seems to generate archive files in its make install step, so we need to set an install prefix.

    ./configure --enable-static=yes --with-pic --prefix='/tmp/libmongoc-install'
    make
    make install

Now just copy over the files we need:

    cp -R /tmp/libmongoc-install/include/* extern/include/
    cp /tmp/libmongoc-install/lib/*.a extern/lib

Note that you will need to `git add` the .a files explicitly, because they are usually ignored:

    git add -f extern/lib/*.a extern/include/*

For your commit message, please specify which version of libmongoc you are adding:

    git commit -m "Update to libmongoc v1.0.2"


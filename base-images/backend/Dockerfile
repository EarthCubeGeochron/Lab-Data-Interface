FROM python:3.8-alpine
LABEL version="1.2"

# Install general and build dependencies
# Note: geos and geos-dev are in the community apk repository
RUN apk update \
 && apk upgrade \
 && echo http://dl-cdn.alpinelinux.org/alpine/edge/community \
     >> /etc/apk/repositories \
 && apk add --no-cache python3-dev libstdc++ openblas \
      libpq postgresql-dev postgresql-client libxslt-dev bash libc-dev \
      musl-dev geos geos-dev openblas-dev \
 && ln -s /usr/include/locale.h /usr/include/xlocale.h \
 && apk add --no-cache --virtual .build_deps gcc g++ gfortran \
     openblas-dev libxml2-dev make

COPY ./base-requirements.txt /src/base-requirements.txt
RUN pip install --upgrade pip \
 && pip install --no-cache -r /src/base-requirements.txt

# Delete build deps and test that we can find GEOS C extensions
RUN rm -rf /src \
 && rm /usr/include/xlocale.h \
 && python -c "import shapely.wkb"

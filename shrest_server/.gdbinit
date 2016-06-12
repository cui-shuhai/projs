
set pagination off
set logging file gdb.txt
set logging on

bp server_http.hpp:141
command
c
end

{
  description = "kronos-app dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_latest
          ];

          # workerd (downloaded by wrangler) is a prebuilt binary that
          # needs libstdc++ at runtime.
          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ];

          shellHook = ''
            echo "kronos-app · node $(node -v) · npm $(npm -v)"
          '';
        };
      });
}

{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    systems.url = "github:nix-systems/default";
    flake-utils.url = "github:numtide/flake-utils";
    flake-utils.inputs.systems.follows = "systems";
  };

  outputs = { self, nixpkgs, flake-utils, systems, ... } @ inputs:
      flake-utils.lib.eachDefaultSystem (system:
        let
            pkgs = import nixpkgs {
              system = system;
              config.allowUnfree = true;
              config.cudaSupport = true;
            };


            libList = [
                # Add needed packages here
                pkgs.stdenv.cc.cc
                pkgs.libuuid
              ];
        in
          with pkgs;
        {
          devShells = {
              default = let 
              in mkShell {
                    NIX_LD = runCommand "ld.so" {} ''
                        ln -s "$(cat '${pkgs.stdenv.cc}/nix-support/dynamic-linker')" $out
                      '';
                    NIX_LD_LIBRARY_PATH = lib.makeLibraryPath libList;
                    packages = [
                      yarn
                      husky
                      # pkgs.nodePackages.husky
                      # nodejs
                    ]
                    ++ libList; 
                    shellHook = ''
                        export LD_LIBRARY_PATH=$NIX_LD_LIBRARY_PATH:$LD_LIBRARY_PATH

                    '';
                  };
              };
        }
      );
}

                        # export PATH=./node_modules/.bin:$PATH
                        # # Add local node_modules binaries to PATH
                        # export PATH=./node_modules/.bin:$PATH

                        # # Automatically install Husky hooks if package.json exists
                        # if [ -f package.json ] && [ -d node_modules/husky ]; then
                        #   echo "Setting up Husky hooks..."
                        #   ./node_modules/.bin/husky install
                        # fi

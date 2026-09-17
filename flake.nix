{
  description = "Hundred development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
    in {
      devShells = nixpkgs.lib.genAttrs systems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          pnpm = pkgs.writeShellScriptBin "pnpm" ''
            exec ${pkgs.corepack}/bin/corepack pnpm "$@"
          '';
        in {
          default = pkgs.mkShell {
            packages = [ pkgs.nodejs_24 pnpm pkgs.git ];
          };
        });
    };
}

import { grpc } from "@improbable-eng/grpc-web";

// gRPC definitions
import { Ab, GetNeighbourAbsRequest, GetNeighbourAbsResponse, NeighbourAbService } from "./generated/neighbour_antibodies";

// Domain classes
import { Metadata } from './models/metadata';
import { Ab as CeliumAb } from './models/ab';

export class NeighbourAntibodiesCommunicationService {

  private createQueryAntibody(ab: CeliumAb): Ab {
    return {
      "id": ab.id,
      "heavy_seq": ab.hc,
      "Light_seq": ab.lc,
      "paired": (!!ab.hc && !!ab.lc),
      "seq_type": 1
    }
  }

  private createAntibodyUniverse(sessionAbs: CeliumAb[]): Ab[] {
    return sessionAbs.map(ab=> {
      return  {
        "id": ab.id,
        "heavy_seq": ab.hc,
        "Light_seq": ab.lc,
        "paired": !!ab.hc && !!ab.lc,
        "seq_type": 1
      }
    });
  }

  private assembleNeighbourAntibodiesRequest(ab: CeliumAb, sessionAbs: CeliumAb[], id?): GetNeighbourAbsRequest {
    return {
      "query": this.createQueryAntibody(ab),
      "universe": this.createAntibodyUniverse(sessionAbs) 
    }
  } 

  private transformNeighbourAntibodiesResponse(res: NeighbourAntibodiesReply): Metadata {
    return res.neighbours; // This will likely require transformation beyond this 
  }

  public getNeighbourAntibodies(ab: Ab, universe: Ab[]): Metadata {
    grpc.unary(NeighbourAbService.GetNeighbourAbs, {
      request: this.assembleNeighbourAntibodiesRequest(ab, universe),
      host: "https://abcd.neighbourabsservice.gov",
      onEnd: res => {
        const { status, message } = res;
        if (status === grpc.Code.OK && message) {
          const result = message.toObject() as NeighbourAntibodiesReply.AsObject;
          return this.transformNeighbourAntibodiesResponse(res);
        }
      }
    });
  }
}

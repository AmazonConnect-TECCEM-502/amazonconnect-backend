import { Request, Response } from "express";
import AbstractController from "./AbstractController";
import db from "../models";

class UserController extends AbstractController {
  // Singleton
  private static instance: UserController;
  public static getInstance(): AbstractController {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new UserController("user");
    return this.instance;
  }

  // Declaración rutas del controlador
  protected initRoutes(): void {
    this.router.get(
      "/readUser",
      this.authMiddleware.verifyToken,
      this.getReadUser.bind(this)
    );
    this.router.get("/agentIds", this.getAgentIds.bind(this));
    this.router.get("/clientIds", this.getClientsIds.bind(this));
    this.router.get("/readAgents", this.getReadAgents.bind(this));
    this.router.get(
      "/userType",
      this.authMiddleware.verifyToken,
      this.getUserType.bind(this)
    );

    // Agregar más rutas
  }

  private async getReadUser(req: Request, res: Response) {
    const user = await db["User"].findOne({
      where: {
        cognito_uuid: req.user,
      },
    });

    if (user != null) {
      res.status(200).json({
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        user_type: user.user_type,
        manager_id: user.manager_id,
      });
    } else {
      res.status(401).json({
        error: "Authentication error",
      });
    }
  }

  private async getAgentIds(req: Request, res: Response) {
    try {
      const agents = await db["User"].findAll({
        where: {
          user_type: "agent",
        },
        attributes: ["user_id", "first_name", "last_name"],
      });
      res.status(200).json(agents);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }

  private async getClientsIds(req: Request, res: Response) {
    try {
      const clients = await db["Client"].findAll({
        attributes: ["client_id", "first_name", "last_name"],
      });
      res.status(200).json(clients);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }

  private async getReadAgents(req: Request, res: Response) {
    try {
      let agent = await db.sequelize.query(
        "SELECT first_name, last_name FROM User WHERE user_type like 'agent%'",
        {
          model: db["User"],
          mapToModel: true,
        }
      );
      //let agent2 = await db["User"].findAll();
      res.status(200).send(agent);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  private async getUserType(req: Request, res: Response) {
    const user = await db["User"].findOne({
      where: {
        cognito_uuid: req.user,
      },
    });

    if (user != null) {
      res.status(200).json({
        email: user.email,
        user_type: user.user_type,
        id: user.user_id,
      });
    } else {
      res.status(401).json({
        error: "Authentication error",
      });
    }
  }
}

export default UserController;

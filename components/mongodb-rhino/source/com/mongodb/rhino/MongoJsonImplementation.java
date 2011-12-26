package com.mongodb.rhino;

import com.threecrickets.rhino.JsonImplementation;

public class MongoJsonImplementation extends JsonImplementation
{
	public MongoJsonImplementation()
	{
		super( new MongoJsonExtender() );
	}
}

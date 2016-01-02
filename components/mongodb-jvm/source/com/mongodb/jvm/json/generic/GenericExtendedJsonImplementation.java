/**
 * Copyright 2010-2016 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.json.generic;

import java.util.Collection;

import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.JsonTransformer;
import com.threecrickets.jvm.json.generic.GenericJsonImplementation;

/**
 * A JSON implementation using standard JVM types, with support for
 * <a href="http://docs.mongodb.org/manual/reference/mongodb-extended-json/">
 * MongoDB's extended JSON</a>.
 * 
 * @author Tal Liron
 */
public class GenericExtendedJsonImplementation extends GenericJsonImplementation
{
	//
	// Static operations
	//

	public static void addEncoders( Collection<JsonEncoder> encoders )
	{
		encoders.add( new BinaryEncoder() );
		encoders.add( new BsonUndefinedEncoder() );
		encoders.add( new DateEncoder() );
		encoders.add( new DBRefEncoder() );
		encoders.add( new LongEncoder() );
		encoders.add( new MaxKeyEncoder() );
		encoders.add( new MinKeyEncoder() );
		encoders.add( new ObjectIdEncoder() );
		// Make sure BsonValueEncoder is last
		encoders.add( new BsonValueEncoder() );
	}

	public static void addTransformers( Collection<JsonTransformer> transformers )
	{
		transformers.add( new BinaryTransformer() );
		transformers.add( new BsonTimestampTransformer() );
		transformers.add( new DateTransformer() );
		transformers.add( new DBRefTransformer() );
		transformers.add( new LongTransformer() );
		transformers.add( new ObjectIdTransformer() );
	}

	//
	// Construction
	//

	public GenericExtendedJsonImplementation()
	{
		addEncoders( encoders );
		GenericJsonImplementation.addEncoders( encoders );
		addTransformers( transformers );
	}

	//
	// JsonImplementation
	//

	public int getPriority()
	{
		return 1;
	}
}
